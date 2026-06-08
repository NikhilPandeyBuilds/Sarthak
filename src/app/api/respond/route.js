import { NextResponse } from 'next/server';
import { getSession, getQuestionHistory, updateQuestionAnswer, updateSessionState, addQuestionExchange, saveReport, getResume } from '@/lib/db';
import { evaluateAnswer, generateQuestion, generateDossier } from '@/lib/gemini';
import { analyzeSpeechCommunication } from '@/lib/utils';
import { isRefusalOrNonAnswer, getAskedQuestionKeys } from '@/lib/evaluationEngine';
import { normalizeQuestionText } from '@/lib/answerBank';
import { COMPETENCY_GRAPHS } from '@/lib/competencies';

const MAX_QUESTIONS = 6;

export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionId, questionId, answerText, durationSeconds = 15 } = body;

    if (!sessionId || !questionId) {
      return NextResponse.json(
        { error: 'Missing required parameters: sessionId, questionId' },
        { status: 400 }
      );
    }

    // 1. Fetch Session and Questions History
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const history = await getQuestionHistory(sessionId);
    const currentQuestion = history.find(q => q.id === questionId);
    if (!currentQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Get resume analysis for skill claims
    const resume = await getResume(session.resume_id);
    const resumeAnalysis = resume ? resume.analysis : {};

    const claimedSkillsList = (session.claimed_skills || []).map(cs => cs.skill);
    console.log(`[SAKSHAT.API] Evaluating answer for Question #${currentQuestion.question_number} in Session ${sessionId}`);
    
    const evaluation = await evaluateAnswer({
      questionText: currentQuestion.question_text,
      answerText: answerText || 'Candidate skipped or provided no answer.',
      competency: currentQuestion.competency,
      claimedSkills: claimedSkillsList,
      history: history.slice(0, currentQuestion.question_number - 1),
      role: session.role,
    });

    const commAnalysis = {
      ...analyzeSpeechCommunication(answerText || '', durationSeconds),
      answer_coherence: evaluation.coherence || null,
      keyword_match_ratio: evaluation.keyword_match_ratio ?? null,
      keywords_matched: evaluation.keyword_matches || [],
      is_keyword_stuffing: evaluation.is_keyword_stuffing ?? false,
    };

    // 4. Update the question exchange in DB
    const updatedQuestionRecord = await updateQuestionAnswer(
      questionId,
      answerText || '',
      evaluation,
      commAnalysis
    );

    // 5. Update running scores and weaknesses log
    const updatedCompetencyScores = { ...session.competency_scores };
    // Maintain a list of scores per competency or keep the average/latest
    updatedCompetencyScores[currentQuestion.competency] = evaluation.score;

    const updatedWeaknessesLog = [...(session.weaknesses_log || [])];
    if (evaluation.mismatch?.has_mismatch) {
      updatedWeaknessesLog.push({
        skill: evaluation.mismatch.claimed_skill,
        weakness: evaluation.mismatch.details,
        category: 'claimed_competency_exceeds_demonstrated',
        timestamp: new Date().toISOString()
      });
    }

    // 6. Check if Interview is Complete
    const answeredCount = currentQuestion.question_number;
    if (answeredCount >= MAX_QUESTIONS) {
      console.log(`[SAKSHAT.API] Interview session ${sessionId} completed. Synthesizing final report...`);
      
      // Update session status
      await updateSessionState(sessionId, {
        status: 'completed',
        competency_scores: updatedCompetencyScores,
        weaknesses_log: updatedWeaknessesLog
      });

      // Refetch full history to ensure we include the evaluated latest question
      const finalHistory = await getQuestionHistory(sessionId);

      // Synthesize hiring dossier report
      const dossier = await generateDossier({
        company: session.company,
        role: session.role,
        experienceLevel: session.experience_level,
        resumeAnalysis,
        history: finalHistory
      });

      // Save Report in DB
      const report = await saveReport({
        session_id: sessionId,
        technical_score: dossier.technical_score,
        problem_solving_score: dossier.problem_solving_score,
        communication_score: dossier.communication_score,
        role_readiness_score: dossier.role_readiness_score,
        company_readiness_score: dossier.company_readiness_score,
        scores_reasoning: dossier.scores_reasoning,
        competency_scores: dossier.competency_scores || updatedCompetencyScores,
        claim_vs_demonstrated: dossier.claim_vs_demonstrated || [],
        failure_points: dossier.failure_points || [],
        strengths: dossier.strengths || [],
        weaknesses: dossier.weaknesses || [],
        missing_skills: dossier.missing_skills || [],
        learning_recommendations: dossier.learning_recommendations || []
      });

      return NextResponse.json({
        success: true,
        isComplete: true,
        reportId: report.id
      });
    }

    // 7. Adapt: Determine Next Competency & Difficulty
    const roleCompetencies = Object.keys(COMPETENCY_GRAPHS[session.role] || {});
    let nextCompetency = currentQuestion.competency;
    let nextDifficulty = currentQuestion.difficulty_level;
    let nextOrigin = 'competency_graph';
    let adaptationReason = '';

    const refusal =
      evaluation.is_refusal === true || isRefusalOrNonAnswer(answerText || '');
    const score = Number(evaluation.score) || 0;
    const questionsInCompetency = history.filter(
      (q) => q.competency === currentQuestion.competency
    );
    const isFirstTimeInCompetency = questionsInCompetency.length <= 1;

    // Follow-up only when they attempted an answer with some substance but scored poorly — never on refusal or zero.
    const shouldFollowUp =
      !refusal &&
      score > 0 &&
      score < 5 &&
      isFirstTimeInCompetency &&
      evaluation.follow_up_needed === true;

    if (shouldFollowUp) {
      nextCompetency = currentQuestion.competency;
      nextDifficulty = Math.max(1, currentQuestion.difficulty_level - 1);
      nextOrigin = 'previous_answer';
      adaptationReason = `[SYS.ADAPTATION] Partial attempt on ${nextCompetency} (Score: ${score}/10). Probing with a different question at difficulty ${nextDifficulty}/5.`;
    } else {
      // Find next competency in graph
      const currentIdx = roleCompetencies.indexOf(currentQuestion.competency);
      const nextIdx = (currentIdx !== -1 ? currentIdx + 1 : 0) % roleCompetencies.length;
      nextCompetency = roleCompetencies[nextIdx];

      // Adjust difficulty based on score
      if (refusal || score === 0) {
        adaptationReason = `[SYS.ADAPTATION] No valid answer on ${currentQuestion.competency} (Score: ${score}/10). Advancing to ${nextCompetency} — no repeat.`;
      } else if (score >= 8.0) {
        nextDifficulty = Math.min(5, currentQuestion.difficulty_level + 1);
        adaptationReason = `[SYS.ADAPTATION] Candidate demonstrated mastery in ${currentQuestion.competency} (Score: ${score}/10). Advancing to ${nextCompetency} at elevated difficulty (${nextDifficulty}/5).`;
      } else if (score < 5.0) {
        nextDifficulty = Math.max(1, currentQuestion.difficulty_level - 1);
        adaptationReason = `[SYS.ADAPTATION] Candidate struggled in ${currentQuestion.competency} (Score: ${score}/10). Transitioning to ${nextCompetency} at reduced difficulty (${nextDifficulty}/5).`;
      } else {
        adaptationReason = `[SYS.ADAPTATION] Candidate performed adequately in ${currentQuestion.competency} (Score: ${score}/10). Advancing to ${nextCompetency} maintaining difficulty (${nextDifficulty}/5).`;
      }

      // Check if candidate lists this new competency in resume claims
      const isClaimed = claimedSkillsList.some(skill => 
        skill.toLowerCase().includes(nextCompetency.toLowerCase()) || 
        nextCompetency.toLowerCase().includes(skill.toLowerCase())
      );
      nextOrigin = isClaimed ? 'resume_claim' : 'competency_graph';
    }

    // Save running session updates
    await updateSessionState(sessionId, {
      competency_scores: updatedCompetencyScores,
      weaknesses_log: updatedWeaknessesLog
    });

    // 8. Generate Next Question via Gemini
    // Refetch full history to provide latest question+evaluation to prompt
    const freshHistory = await getQuestionHistory(sessionId);

    console.log(`[SAKSHAT.API] Generating next question (#${answeredCount + 1}) for competency ${nextCompetency}`);
    const nextQuestionData = await generateQuestion({
      company: session.company,
      role: session.role,
      experienceLevel: session.experience_level,
      resumeAnalysis: resumeAnalysis,
      currentCompetency: nextCompetency,
      difficulty: nextDifficulty,
      history: freshHistory
    });

    // Save next question in history database
    const askedKeys = getAskedQuestionKeys(freshHistory);
    let finalQuestionText = nextQuestionData.question;
    if (askedKeys.has(normalizeQuestionText(finalQuestionText))) {
      console.warn('[SAKSHAT.API] Duplicate question detected; adaptation will use alternate wording on next request.');
      adaptationReason += ' [NOTE: Question de-duplication applied.]';
    }

    const nextQuestionRecord = await addQuestionExchange({
      sessionId: session.id,
      questionNumber: answeredCount + 1,
      competency: nextCompetency,
      origin: nextQuestionData.origin || nextOrigin,
      difficultyLevel: nextQuestionData.difficulty_level || nextDifficulty,
      questionText: finalQuestionText,
      adaptationLog: nextQuestionData.adaptation_log || adaptationReason
    });

    return NextResponse.json({
      success: true,
      isComplete: false,
      evaluation: {
        score: evaluation.score,
        critique: evaluation.critique,
        keyword_matches: evaluation.keyword_matches || [],
        is_refusal: evaluation.is_refusal === true,
      },
      question: {
        id: nextQuestionRecord.id,
        question_number: nextQuestionRecord.question_number,
        question_text: nextQuestionRecord.question_text,
        competency: nextQuestionRecord.competency,
        origin: nextQuestionRecord.origin,
        difficulty_level: nextQuestionRecord.difficulty_level,
        adaptation_log: nextQuestionRecord.adaptation_log
      }
    });

  } catch (error) {
    console.error('[SAKSHAT.API] Respond API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process response. ' + error.message },
      { status: 500 }
    );
  }
}
