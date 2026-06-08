import { NextResponse } from 'next/server';
import { getResume, createSession, addQuestionExchange } from '@/lib/db';
import { generateQuestion } from '@/lib/gemini';
import { COMPETENCY_GRAPHS } from '@/lib/competencies';

export async function POST(request) {
  try {
    const body = await request.json();
    const { resumeId, company, role, experienceLevel } = body;

    if (!resumeId || !company || !role || !experienceLevel) {
      return NextResponse.json(
        { error: 'Missing required parameters: resumeId, company, role, experienceLevel' },
        { status: 400 }
      );
    }

    // Retrieve resume context
    const resume = await getResume(resumeId);
    if (!resume) {
      return NextResponse.json({ error: 'Resume record not found' }, { status: 404 });
    }

    // Set up initial claimed skills
    const skillsList = resume.analysis?.skills || [];
    const claimedSkills = skillsList.map(skill => ({
      skill,
      level: resume.analysis.technical_depth || 'Mid',
      source: 'resume'
    }));

    // Create session in DB
    const session = await createSession(resumeId, company, role, experienceLevel, claimedSkills);

    // Pick first competency
    const competenciesList = Object.keys(COMPETENCY_GRAPHS[role] || {});
    const firstCompetency = competenciesList[0] || 'Fundamentals';

    // Generate first question (starting at Intermediate level 3)
    const initialDifficulty = 3;
    console.log(`[SAKSHAT.API] Generating first question for Session ${session.id} (${firstCompetency})`);
    
    const questionData = await generateQuestion({
      company,
      role,
      experienceLevel,
      resumeAnalysis: resume.analysis,
      currentCompetency: firstCompetency,
      difficulty: initialDifficulty,
      history: []
    });

    // Save generated question in history
    const questionRecord = await addQuestionExchange({
      sessionId: session.id,
      questionNumber: 1,
      competency: firstCompetency,
      origin: questionData.origin || 'competency_graph',
      difficultyLevel: questionData.difficulty_level || initialDifficulty,
      questionText: questionData.question,
      adaptationLog: questionData.adaptation_log || `[SYS.ADAPTATION] Initializing interview chamber. Focus competency: ${firstCompetency}.`
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      question: {
        id: questionRecord.id,
        question_number: 1,
        question_text: questionRecord.question_text,
        competency: questionRecord.competency,
        origin: questionRecord.origin,
        difficulty_level: questionRecord.difficulty_level,
        adaptation_log: questionRecord.adaptation_log
      }
    });
  } catch (error) {
    console.error('[SAKSHAT.API] Start Interview Error:', error);
    return NextResponse.json(
      { error: 'Failed to start interview. ' + error.message },
      { status: 500 }
    );
  }
}
