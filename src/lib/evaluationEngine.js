import { findAnswerRubric, normalizeQuestionText } from './answerBank';

const REFUSAL_PATTERNS = [
  /\bi\s+don'?t\s+know\b/i,
  /\bno\s+idea\b/i,
  /\bnot\s+sure\b/i,
  /\bcan'?t\s+answer\b/i,
  /\bno\s+clue\b/i,
  /\bdon'?t\s+remember\b/i,
  /\bhaven'?t\s+learned\b/i,
  /\bpass\b/i,
  /\bskip(ped)?\b/i,
  /\bcandidate\s+skipped\b/i,
];

const EXPLANATION_MARKERS = [
  'because',
  'therefore',
  'since',
  'which means',
  'so that',
  'when',
  'where',
  'while',
  'by using',
  'works by',
  'is used',
  'allows',
  'enables',
  'compared to',
  'differs from',
  'results in',
  'in order to',
];

const CONNECTIVE_WORDS = [
  'and',
  'but',
  'or',
  'because',
  'so',
  'which',
  'that',
  'when',
  'where',
  'while',
  'although',
  'however',
  'therefore',
  'thus',
  'hence',
];

export function isRefusalOrNonAnswer(answerText = '') {
  const text = (answerText || '').trim();
  if (!text) return true;
  if (/^candidate\s+skipped/i.test(text)) return true;

  const lower = text.toLowerCase();
  const wordCount = lower.split(/\s+/).filter(Boolean).length;

  if (wordCount <= 2 && REFUSAL_PATTERNS.some((p) => p.test(lower))) return true;
  if (wordCount <= 6 && REFUSAL_PATTERNS.some((p) => p.test(lower))) return true;

  return false;
}

/**
 * Detect keyword dumping: many technical terms, little grammatical structure.
 */
export function detectKeywordStuffing(answerText, matchedKeywords = []) {
  const text = (answerText || '').trim();
  if (!text || matchedKeywords.length < 3) return false;

  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  if (wordCount < 4) return false;

  const matchedSet = new Set(matchedKeywords.map((k) => k.toLowerCase()));
  let techWordHits = 0;
  words.forEach((w) => {
    const clean = w.replace(/[^a-z0-9]/g, '');
    if ([...matchedSet].some((k) => clean.includes(k) || k.includes(clean))) techWordHits++;
  });

  const techRatio = techWordHits / wordCount;
  const hasConnective = CONNECTIVE_WORDS.some((c) => text.toLowerCase().includes(` ${c} `));
  const hasExplanation = EXPLANATION_MARKERS.some((m) => text.toLowerCase().includes(m));
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLen =
    sentences.length > 0 ? words.length / sentences.length : words.length;

  return techRatio > 0.45 && !hasExplanation && (!hasConnective || avgSentenceLen < 5);
}

/**
 * Coherence: words arranged into explainable sentences, not a list of terms.
 */
export function analyzeAnswerCoherence(answerText = '') {
  const text = (answerText || '').trim();
  if (!text) {
    return {
      coherence_score: 0,
      coherence_label: 'none',
      has_explanation_structure: false,
      sentence_count: 0,
      avg_sentence_length: 0,
    };
  }

  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const lower = text.toLowerCase();
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 3);
  const sentenceCount = Math.max(sentences.length, 1);
  const avgSentenceLength = wordCount / sentenceCount;

  const hasExplanation = EXPLANATION_MARKERS.some((m) => lower.includes(m));
  const hasConnective = CONNECTIVE_WORDS.some(
    (c) => lower.includes(` ${c} `) || lower.startsWith(`${c} `)
  );
  const hasVerbLike =
    /\b(is|are|was|were|use|uses|using|work|works|mean|means|allow|reduce|compute|calculate|apply|implements?)\b/i.test(
      text
    );

  let coherenceScore = 0;
  if (wordCount >= 12 && hasExplanation && hasConnective) coherenceScore = 1;
  else if (wordCount >= 8 && (hasExplanation || (hasConnective && hasVerbLike))) coherenceScore = 0.75;
  else if (wordCount >= 6 && hasVerbLike) coherenceScore = 0.5;
  else if (wordCount >= 4) coherenceScore = 0.25;

  let coherenceLabel = 'low';
  if (coherenceScore >= 0.85) coherenceLabel = 'high';
  else if (coherenceScore >= 0.5) coherenceLabel = 'moderate';

  return {
    coherence_score: coherenceScore,
    coherence_label: coherenceLabel,
    has_explanation_structure: hasExplanation && (hasConnective || hasVerbLike),
    sentence_count: sentences.length,
    avg_sentence_length: Math.round(avgSentenceLength * 10) / 10,
  };
}

function matchKeywords(answerText, expectedKeywords = []) {
  const lower = answerText.toLowerCase();
  const matched = [];
  const missing = [];

  expectedKeywords.forEach((kw) => {
    const k = kw.toLowerCase();
    if (lower.includes(k)) matched.push(kw);
    else missing.push(kw);
  });

  return { matched, missing };
}

function matchConceptPhrases(answerText, conceptPhrases = []) {
  const lower = answerText.toLowerCase();
  const matched = conceptPhrases.filter((p) => lower.includes(p.toLowerCase()));
  return matched;
}

/**
 * Deterministic 0–10 score from answer bank + coherence.
 */
export function scoreAnswerWithRubric({
  questionText,
  answerText,
  role,
  competency,
}) {
  const rubric = findAnswerRubric(questionText, role, competency);
  const coherence = analyzeAnswerCoherence(answerText);

  if (isRefusalOrNonAnswer(answerText)) {
    return {
      score: 0,
      critique:
        'No substantive answer provided. The candidate declined or could not address the technical question.',
      difficulty_adjustment: -1,
      follow_up_needed: false,
      is_refusal: true,
      rubric_id: rubric.id,
      keyword_matches: [],
      keyword_match_ratio: 0,
      concept_phrases_matched: [],
      coherence,
      is_keyword_stuffing: false,
    };
  }

  const { matched: keywordMatches, missing: keywordMissing } = matchKeywords(
    answerText,
    rubric.expectedKeywords || []
  );
  const phraseMatches = matchConceptPhrases(answerText, rubric.conceptPhrases || []);
  const minKw = rubric.minKeywordsForPartial ?? 2;
  const totalKw = (rubric.expectedKeywords || []).length || 1;
  const keywordRatio = keywordMatches.length / totalKw;
  const stuffing = detectKeywordStuffing(answerText, keywordMatches);

  let score = 0;
  let critique = '';

  if (keywordMatches.length === 0 && phraseMatches.length === 0) {
    score = 0;
    critique =
      'Answer did not include relevant technical concepts or vocabulary for this question. Expected topics were not demonstrated.';
  } else if (stuffing) {
    score = 1;
    critique =
      'Response lists technical terms without coherent explanation. Keywords must be used in meaningful sentences that show understanding.';
  } else if (keywordMatches.length < minKw && phraseMatches.length === 0) {
    score = coherence.coherence_score >= 0.5 ? 2 : 1;
    critique = `Minimal relevance detected (${keywordMatches.join(', ') || 'weak signals'}). Missing core concepts such as: ${keywordMissing.slice(0, 4).join(', ')}.`;
  } else if (keywordMatches.length < minKw && phraseMatches.length > 0) {
    score = coherence.has_explanation_structure ? 4 : 3;
    critique = `Partial conceptual signal (${phraseMatches.join('; ')}) but insufficient depth and missing key terms: ${keywordMissing.slice(0, 3).join(', ')}.`;
  } else if (keywordMatches.length >= minKw && phraseMatches.length === 0) {
    score = coherence.has_explanation_structure ? 5 : 3;
    critique = `Correct terminology present (${keywordMatches.slice(0, 5).join(', ')}) but lacks structured explanation linking ideas together.`;
  } else if (keywordMatches.length >= minKw && phraseMatches.length >= 1) {
    if (coherence.coherence_score >= 0.75) {
      score = keywordMatches.length >= minKw + 2 ? 8 : 7;
      critique = `Solid answer covering key ideas (${phraseMatches.join('; ')}). Demonstrates understanding with appropriate technical framing.`;
    } else {
      score = 5;
      critique = `Relevant concepts identified (${phraseMatches.join('; ')}) but explanation structure is weak. Needs clearer cause-effect and technical reasoning.`;
    }
  }

  if (phraseMatches.length >= 2 && coherence.coherence_score >= 0.85 && keywordMatches.length >= minKw + 1) {
    score = Math.max(score, 9);
    critique = `Strong, well-structured technical answer covering ${phraseMatches.join('; ')} with clear reasoning.`;
  }

  score = Math.min(10, Math.max(0, Math.round(score)));

  let difficulty_adjustment = 0;
  if (score >= 8) difficulty_adjustment = 1;
  else if (score <= 2) difficulty_adjustment = -1;

  return {
    score,
    critique,
    difficulty_adjustment,
    follow_up_needed: score > 0 && score < 6 && !stuffing,
    is_refusal: false,
    rubric_id: rubric.id,
    keyword_matches: keywordMatches,
    keyword_match_ratio: Math.round(keywordRatio * 100) / 100,
    concept_phrases_matched: phraseMatches,
    coherence,
    is_keyword_stuffing: stuffing,
  };
}

export function mergeEvaluationWithRubric(llmEvaluation, rubricEvaluation, claimedSkills = []) {
  if (rubricEvaluation.is_refusal || rubricEvaluation.score === 0) {
    const skill =
      claimedSkills[0]?.skill || claimedSkills[0] || '';
    return {
      ...rubricEvaluation,
      score: 0,
      follow_up_needed: false,
      difficulty_adjustment: -1,
      mismatch: {
        has_mismatch: Boolean(skill),
        claimed_skill: skill,
        details: skill
          ? `No demonstrable knowledge of ${rubricEvaluation.rubric_id || 'topic'} despite resume claim.`
          : '',
      },
    };
  }

  const finalScore = Math.min(
    Number(llmEvaluation?.score ?? 10),
    Number(rubricEvaluation.score)
  );

  let critique = rubricEvaluation.critique;
  if (llmEvaluation?.critique && finalScore > 2) {
    critique = `${rubricEvaluation.critique} ${llmEvaluation.critique}`.trim();
  } else if (finalScore <= 1) {
    critique = rubricEvaluation.critique;
  }

  const mismatch =
    finalScore < 5 && claimedSkills.length > 0 && rubricEvaluation.keyword_matches.length < 2
      ? {
          has_mismatch: true,
          claimed_skill: claimedSkills[0]?.skill || claimedSkills[0] || '',
          details: `Answer did not demonstrate expected knowledge for this competency (rubric score ${finalScore}/10).`,
        }
      : llmEvaluation?.mismatch || {
          has_mismatch: false,
          claimed_skill: '',
          details: '',
        };

  return {
    score: rubricEvaluation.is_refusal ? 0 : finalScore,
    critique,
    difficulty_adjustment:
      rubricEvaluation.is_refusal || finalScore === 0
        ? -1
        : (llmEvaluation?.difficulty_adjustment ?? rubricEvaluation.difficulty_adjustment),
    follow_up_needed: rubricEvaluation.is_refusal ? false : rubricEvaluation.follow_up_needed,
    mismatch,
    is_refusal: rubricEvaluation.is_refusal,
    rubric_score: rubricEvaluation.score,
    rubric_id: rubricEvaluation.rubric_id,
    keyword_matches: rubricEvaluation.keyword_matches,
    keyword_match_ratio: rubricEvaluation.keyword_match_ratio,
    concept_phrases_matched: rubricEvaluation.concept_phrases_matched,
    coherence: rubricEvaluation.coherence,
    is_keyword_stuffing: rubricEvaluation.is_keyword_stuffing,
  };
}

/** Questions already asked (normalized) for de-duplication */
export function getAskedQuestionKeys(history = []) {
  return new Set((history || []).map((h) => normalizeQuestionText(h.question_text || '')));
}
