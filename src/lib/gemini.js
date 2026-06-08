import { COMPETENCY_GRAPHS } from './competencies';
import { findAnswerRubric, normalizeQuestionText } from './answerBank';
import {
  scoreAnswerWithRubric,
  mergeEvaluationWithRubric,
  getAskedQuestionKeys,
} from './evaluationEngine';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/** True when GEMINI_API_KEY is present (live path). API errors may still use mocks. */
export function isGeminiConfigured() {
  const key = GEMINI_API_KEY && String(GEMINI_API_KEY).trim();
  if (!key || key === 'your_api_key_here') return false;
  return true;
}

/** Server-side status for UI badge and diagnostics. */
export function getGeminiStatus() {
  const configured = isGeminiConfigured();
  return {
    mode: configured ? 'live' : 'mock',
    model: MODEL_NAME,
    configured,
    reason: configured
      ? null
      : 'GEMINI_API_KEY is not set. Add it to .env.local and restart the dev server.',
  };
}

// Helper to call Gemini API via direct HTTP POST fetch
async function callGemini(contents, responseMimeType = 'application/json') {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    contents,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
    }
  };

  if (responseMimeType === 'application/json') {
    payload.generationConfig.responseMimeType = 'application/json';
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error [${response.status}]: ${errText}`);
  }

  const resJson = await response.json();
  try {
    const textResult = resJson.candidates[0].content.parts[0].text;
    return responseMimeType === 'application/json' ? JSON.parse(textResult) : textResult;
  } catch (err) {
    console.error('Error parsing Gemini response parts', resJson, err);
    throw new Error('Invalid response structure from Gemini API');
  }
}

// -------------------------------------------------------------
// 1. RESUME ANALYZER
// -------------------------------------------------------------
export async function analyzeResume(resumeContent, isPdf = false) {
  if (!GEMINI_API_KEY) {
    return getMockResumeAnalysis(resumeContent);
  }

  const userPrompt = `Analyze the following resume content. Extract the core technologies, frameworks, and programming languages. Determine if the domain leans towards AI/ML, Backend, Fullstack, or Frontend. Identify 3 strengths and 3 weaknesses. Return strictly a JSON object matching this structure:
{
  "skills": ["string"],
  "frameworks": ["string"],
  "languages": ["string"],
  "projects": [{"title": "string", "description": "string"}],
  "domain_specialization": "string",
  "technical_depth": "Junior" | "Mid" | "Senior",
  "strengths": ["string"],
  "weaknesses": ["string"]
}`;

  let contents;
  if (isPdf) {
    contents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: resumeContent // base64 string
            }
          },
          {
            text: userPrompt
          }
        ]
      }
    ];
  } else {
    contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Resume Text:\n${resumeContent}\n\n${userPrompt}`
          }
        ]
      }
    ];
  }

  try {
    return await callGemini(contents, 'application/json');
  } catch (err) {
    console.error('Gemini Resume Parsing failed. Using fallback mock.', err);
    return getMockResumeAnalysis(resumeContent);
  }
}

// -------------------------------------------------------------
// 2. ADAPTIVE QUESTION GENERATOR
// -------------------------------------------------------------
export async function generateQuestion({
  company,
  role,
  experienceLevel,
  resumeAnalysis,
  currentCompetency,
  difficulty, // 1 to 5
  history // array of { question_text, answer_text, evaluation }
}) {
  if (!GEMINI_API_KEY) {
    return getMockQuestion({ company, role, currentCompetency, difficulty, history });
  }

  const systemInstructions = `You are a Lead Software Engineer and expert interviewer at ${company} conducting an interview for an ${role} position at the ${experienceLevel} level.
Resume Analysis Context of the candidate: ${JSON.stringify(resumeAnalysis)}
Target Competency to Evaluate: ${currentCompetency}
Target Difficulty Level: ${difficulty} (1: Beginner, 3: Intermediate, 5: Advanced)

Style Emphasis based on Company:
- Google: Deep fundamentals, CS concepts (data structures, algorithms, scaling boundaries), design tradeoffs, rigorous conceptual "why".
- OpenAI: AI systems theoretical limits, model scale, safety guidelines, research assumptions, and novel improvements.
- NVIDIA: High-performance computing, optimization, GPU architectures, memory caching, latency bottlenecks, CUDA acceleration.

Rules:
1. Generate exactly one clear, challenging question.
2. If this is the start of the topic, ask a conceptual fundamental question.
3. If the candidate previously discussed a project or made a specific technical claim in their resume, you MUST target that claim (origin: 'resume_claim') or follow up on their previous answer (origin: 'previous_answer').
4. The question must feel natural, conversational, and direct. NEVER repeat or rephrase a question already listed in Interview History below.
5. If the candidate refused or scored 0 on the previous question, move to a different sub-topic — do not ask the same question again.
6. Provide a short, precise "adaptation_log" explaining WHY you chose this question (e.g. "Candidate claims experience with PyTorch but failed basic backpropagation math. Probing basic computational graph mechanics to see if knowledge aligns with claim.").

Return strictly a JSON object:
{
  "question": "string",
  "origin": "resume_claim" | "competency_graph" | "company_style" | "previous_answer",
  "difficulty_level": integer,
  "adaptation_log": "string"
}`;

  const conversationHistoryText = history.map((h, i) => 
    `Q${i+1}: ${h.question_text}\nA${i+1}: ${h.answer_text || 'No answer provided.'}\nEvaluation: ${JSON.stringify(h.evaluation || {})}`
  ).join('\n\n');

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `${systemInstructions}\n\nInterview History:\n${conversationHistoryText || 'No history yet. This is the first question.'}\n\nGenerate the next question:`
        }
      ]
    }
  ];

  try {
    return await callGemini(contents, 'application/json');
  } catch (err) {
    console.error('Gemini Question Generation failed. Using fallback mock.', err);
    return getMockQuestion({ company, role, currentCompetency, difficulty, history });
  }
}

// -------------------------------------------------------------
// 3. ANSWER EVALUATOR
// -------------------------------------------------------------
export async function evaluateAnswer({
  questionText,
  answerText,
  competency,
  claimedSkills = [],
  history = [],
  role = 'AI/ML Engineer',
}) {
  const rubricEval = scoreAnswerWithRubric({
    questionText,
    answerText,
    role,
    competency,
  });

  if (rubricEval.is_refusal || rubricEval.score === 0) {
    return mergeEvaluationWithRubric(null, rubricEval, claimedSkills);
  }

  if (!isGeminiConfigured()) {
    return getMockEvaluation({ questionText, answerText, competency, claimedSkills, role });
  }

  const rubric = findAnswerRubric(questionText, role, competency);

  const systemInstructions = `Evaluate the candidate's response to the technical question.
Question: "${questionText}"
Candidate's Answer: "${answerText}"
Target Competency: "${competency}"
Role: "${role}"
Candidate Claimed Skills (from Resume): ${JSON.stringify(claimedSkills)}

MANDATORY RUBRIC (from answer bank):
- Expected technical keywords: ${JSON.stringify(rubric.expectedKeywords || [])}
- Expected concept phrases: ${JSON.stringify(rubric.conceptPhrases || [])}
- Keywords detected in answer: ${JSON.stringify(rubricEval.keyword_matches)}
- Concept phrases detected: ${JSON.stringify(rubricEval.concept_phrases_matched)}
- Coherence analysis: ${JSON.stringify(rubricEval.coherence)}
- Keyword stuffing detected: ${rubricEval.is_keyword_stuffing}
- Deterministic rubric score (0-10 ceiling): ${rubricEval.score}

SCORING RULES (strict):
1. Score 0 for "I don't know", empty answers, or zero relevant technical content.
2. Score 0-1 for answers that only dump keywords without grammatical explanation (no because/therefore/how/why structure).
3. Do NOT give partial credit for unrelated or wrong-topic content.
4. Your score MUST NOT exceed the rubric score unless the answer clearly exceeds rubric expectations with correct, coherent explanations.
5. matched keywords must be used in meaningful sentences, not comma-separated buzzwords.

Provide a score (0 to 10), critique, difficulty_adjustment (-1|0|1), follow_up_needed (false if refusal or score 0), and mismatch check.

Return strictly a JSON object:
{
  "score": number,
  "critique": "string",
  "difficulty_adjustment": -1 | 0 | 1,
  "follow_up_needed": boolean,
  "mismatch": {
    "has_mismatch": boolean,
    "claimed_skill": "string",
    "details": "string"
  }
}`;

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: systemInstructions,
        },
      ],
    },
  ];

  try {
    const llmEval = await callGemini(contents, 'application/json');
    return mergeEvaluationWithRubric(llmEval, rubricEval, claimedSkills);
  } catch (err) {
    console.error('Gemini Evaluation failed. Using rubric-only scoring.', err);
    return mergeEvaluationWithRubric(null, rubricEval, claimedSkills);
  }
}

// -------------------------------------------------------------
// 4. REPORTS / DOSSIER GENERATOR
// -------------------------------------------------------------
export async function generateDossier({
  company,
  role,
  experienceLevel,
  resumeAnalysis,
  history // complete array of { question_text, answer_text, evaluation, competency, origin, difficulty_level }
}) {
  if (!GEMINI_API_KEY) {
    return getMockDossier({ company, role, experienceLevel, resumeAnalysis, history });
  }

  const systemInstructions = `You are a Principal Engineering Recruiter and Technical Director at ${company}.
Synthesize a comprehensive, executive-level Hiring Dossier for a candidate who completed an adaptive interview for the ${role} position.

Candidate Resume Context:
${JSON.stringify(resumeAnalysis)}

Full Interview History & Evaluation:
${JSON.stringify(history)}

Generate scores (0-100) and written reasoning for these five main dimensions:
1. Technical Knowledge
2. Problem Solving
3. Communication
4. Role Readiness
5. Company Readiness

Provide:
1. Competency Scores: Final scores (0-10) for every competency evaluated in the history.
2. Claim vs Demonstrated: A list of claims from the resume that were tested, outlining what was demonstrated vs what was claimed, and a match_status ('match', 'mismatch', or 'untested').
3. Top 5 Strengths and Top 5 Weaknesses based on their responses.
4. Most Likely Failure Points: 2-3 reasons why this candidate might fail a real interview at ${company}.
5. Personalized Learning Path: A timeline of topics, recommended books/papers/whitepapers, and tasks to improve.

Return strictly a JSON object:
{
  "technical_score": integer,
  "problem_solving_score": integer,
  "communication_score": integer,
  "role_readiness_score": integer,
  "company_readiness_score": integer,
  "scores_reasoning": {
    "technical": "string",
    "problem_solving": "string",
    "communication": "string",
    "role_readiness": "string",
    "company_readiness": "string"
  },
  "competency_scores": {
    "competency_name_string": number
  },
  "claim_vs_demonstrated": [
    {
      "claim": "string",
      "demonstrated": "string",
      "match_status": "match" | "mismatch" | "untested"
    }
  ],
  "failure_points": ["string"],
  "strengths": ["string"],
  "weaknesses": ["string"],
  "missing_skills": ["string"],
  "learning_recommendations": ["string"]
}`;

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: systemInstructions
        }
      ]
    }
  ];

  try {
    return await callGemini(contents, 'application/json');
  } catch (err) {
    console.error('Gemini Dossier Generation failed. Using fallback mock.', err);
    return getMockDossier({ company, role, experienceLevel, resumeAnalysis, history });
  }
}

// -------------------------------------------------------------
// LOCAL HIGH-FIDELITY MOCKS (FALLBACKS)
// -------------------------------------------------------------

function getMockResumeAnalysis(resumeText = '') {
  const isML = resumeText.toLowerCase().includes('ml') || 
               resumeText.toLowerCase().includes('model') || 
               resumeText.toLowerCase().includes('python') || 
               resumeText.toLowerCase().includes('dataset');
  
  if (isML) {
    return {
      skills: ['Python', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'NumPy', 'Pandas'],
      frameworks: ['PyTorch Lightning', 'FastAPI', 'HuggingFace'],
      languages: ['Python', 'SQL', 'C++'],
      projects: [
        { title: 'Image Classifier using CNNs', description: 'Built an image classification pipeline with PyTorch, achieving 92% validation accuracy on CIFAR-10.' },
        { title: 'LLM Fine-Tuning platform', description: 'Implemented LoRA fine-tuning for Llama models using HuggingFace PEFT.' }
      ],
      domain_specialization: 'Machine Learning & Deep Learning',
      technical_depth: 'Mid',
      strengths: [
        'Strong fundamental training in deep learning architectures (CNNs, Transformers)',
        'Practical knowledge of PEFT/LoRA fine-tuning workflows',
        'Capable python programmer with good software engineering standards'
      ],
      weaknesses: [
        'Limited experience in scaling model deployments under high concurrency',
        'Minimal exposure to GPU custom CUDA optimizations',
        'Weak understanding of model drift monitoring and production MLOps loops'
      ]
    };
  } else {
    return {
      skills: ['NodeJS', 'React', 'PostgreSQL', 'Redis', 'Docker', 'REST APIs'],
      frameworks: ['Express', 'NextJS', 'NestJS'],
      languages: ['JavaScript', 'TypeScript', 'SQL', 'HTML/CSS'],
      projects: [
        { title: 'Collaborative Task Hub', description: 'Full-stack application utilizing WebSockets for real-time state synchronization, hosted on AWS.' },
        { title: 'E-Commerce Database Scaling', description: 'Redesigned Postgres tables, introduced custom indexing and caching with Redis, reducing database load by 40%.' }
      ],
      domain_specialization: 'Backend Web Engineering & Databases',
      technical_depth: 'Mid',
      strengths: [
        'Demonstrates clear understanding of API design principles and SQL databases',
        'Familiar with JWT auth and session caching schemes using Redis',
        'Solid knowledge of containerized systems (Docker)'
      ],
      weaknesses: [
        'Limited exposure to distributed consensus protocols (Raft, Paxos)',
        'Struggled with complex load balancer scheduling logic',
        'Lacks hands-on experience setting up multi-region highly available VPCs'
      ]
    };
  }
}

const mockQuestions = {
  'AI/ML Engineer': {
    'Mathematics': [
      "In deep learning backpropagation, how does the Jacobian matrix function during chain rule calculation of gradient descent? Can you explain the shape matching requirement?",
      "Suppose you are training a model using Stochastic Gradient Descent. What mathematical conditions define a convex optimization problem, and how does gradient descent guarantee global convergence in this setup?",
    ],
    'Statistics': [
      "Explain the mathematical formulation of Maximum Likelihood Estimation (MLE). How does it differ from Maximum A Posteriori (MAP) estimation in terms of prior assumptions?",
      "What is the difference between Type I and Type II errors in hypothesis testing? How do p-values relate to the significance level alpha?",
    ],
    'Deep Learning': [
      "Explain the mathematical differences between Layer Normalization (LayerNorm) and Batch Normalization (BatchNorm). Why does LayerNorm perform significantly better in sequential Transformer models?",
      "Can you write down the self-attention formula in Transformers? Explain the role of the scaling factor (square root of key dimension) and what happens to the gradients if it is omitted.",
    ],
    'Machine Learning': [
      "How does Random Forest reduce model variance mathematically compared to a single Decision Tree? Explain the concepts of bagging and feature bootstrapping.",
    ],
    'NLP': [
      "What is the mathematical rationale behind Parameter-Efficient Fine-Tuning (PEFT) methods like LoRA? How does low-rank matrix decomposition reduce the memory footprint during training?",
    ]
  },
  'Backend Engineer': {
    'APIs': [
      "When designing public endpoints, how would you implement a sliding-window rate limiter using Redis? What Redis data structure works best to handle high concurrency?",
      "Explain the differences between REST and gRPC. In what network environments or service layouts does gRPC provide significant latency advantages?",
    ],
    'Databases': [
      "How does a database B-Tree index work under the hood? Explain the difference in disk seek operations between a clustered index and a non-clustered index in PostgreSQL.",
      "Explain the ACID transaction model. In a highly distributed database environment, how does the CAP Theorem restrict your ability to guarantee both strong consistency and high availability?",
    ],
    'Caching': [
      "How does the Cache-Aside caching pattern differ from a Write-Through pattern? How do you prevent a 'cache stampede' or 'thundering herd' when a high-traffic cache key expires?",
    ],
    'Scalability': [
      "What is the Saga Pattern in microservices? How does it manage transactions across distributed microservices compared to a two-phase commit (2PC)?",
    ]
  }
};

function pickUnaskedQuestion(roleQuestions, preferredCompetency, askedKeys) {
  const qs =
    roleQuestions[preferredCompetency] ||
    roleQuestions['Deep Learning'] ||
    roleQuestions['Databases'] ||
    [];

  for (const q of qs) {
    if (!askedKeys.has(normalizeQuestionText(q))) {
      return { questionText: q, competency: preferredCompetency };
    }
  }

  const fallbackIndex = askedKeys.size % Math.max(qs.length, 1);
  return {
    questionText: qs[fallbackIndex] || qs[0],
    competency: preferredCompetency,
  };
}

function getMockQuestion({ company, role, currentCompetency, difficulty, history }) {
  const roleQuestions = mockQuestions[role] || mockQuestions['Backend Engineer'];
  const askedKeys = getAskedQuestionKeys(history);
  const picked = pickUnaskedQuestion(roleQuestions, currentCompetency, askedKeys);
  let questionText = picked.questionText;
  const effectiveCompetency = picked.competency;

  // Tailor slightly to company style
  let styleReason = '';
  if (company === 'Google') {
    questionText = `${questionText} Focus specifically on the fundamental tradeoffs and architectural reasoning.`;
    styleReason = 'Google fundamentals focus bias applied.';
  } else if (company === 'OpenAI') {
    questionText = `${questionText} How does this relate to safety considerations or theoretical scalability thresholds?`;
    styleReason = 'OpenAI scale and safety limits bias applied.';
  } else if (company === 'NVIDIA') {
    questionText = `${questionText} Think about how this impacts GPU caching, memory throughput, and kernel optimization.`;
    styleReason = 'NVIDIA hardware and latency optimization bias applied.';
  }

  const origins = ['resume_claim', 'competency_graph', 'company_style', 'previous_answer'];
  const origin = history.length === 0 ? 'resume_claim' : origins[history.length % origins.length];

  return {
    question: questionText,
    origin: origin,
    difficulty_level: difficulty,
    adaptation_log: `[SYS.ADAPTATION] Testing ${effectiveCompetency} at Level ${difficulty}/5. Question origin: ${origin.toUpperCase()}. ${styleReason}`
  };
}

function getMockEvaluation({ questionText, answerText, competency, claimedSkills, role = 'AI/ML Engineer' }) {
  const rubricEval = scoreAnswerWithRubric({
    questionText,
    answerText,
    role,
    competency,
  });
  return mergeEvaluationWithRubric(null, rubricEval, claimedSkills);
}

function getMockDossier({ company, role, experienceLevel, resumeAnalysis, history }) {
  // Aggregate scores from history
  let totalScore = 0;
  const compScores = {};
  
  history.forEach(h => {
    const scoreVal = h.evaluation?.score || 7;
    totalScore += scoreVal;
    compScores[h.competency] = Math.max(compScores[h.competency] || 0, scoreVal);
  });

  const avgScore = history.length > 0 ? (totalScore / history.length) * 10 : 70;
  
  // Create claims comparison
  const claimsCompared = (resumeAnalysis.skills || []).map((skill, index) => {
    const wasTested = index < 3;
    let match_status = 'untested';
    let demonstrated = 'Not probed during this session.';
    
    if (wasTested) {
      const failed = history.some(h => h.evaluation?.mismatch?.has_mismatch && h.evaluation.mismatch.claimed_skill === skill);
      match_status = failed ? 'mismatch' : 'match';
      demonstrated = failed 
        ? 'Struggled to articulate core principles under prompt questions.'
        : 'Demonstrated solid working knowledge and explained tradeoffs correctly.';
    }

    return { claim: skill, demonstrated, match_status };
  });

  return {
    technical_score: Math.round(avgScore),
    problem_solving_score: Math.round(avgScore * 0.95),
    communication_score: 85,
    role_readiness_score: Math.round(avgScore * 1.02),
    company_readiness_score: Math.round(avgScore * 0.98),
    scores_reasoning: {
      technical: `The candidate demonstrates strong theoretical knowledge in ${role === 'AI/ML Engineer' ? 'model architectures' : 'system design'}, scoring highly on fundamentals. However, gaps remain in operational deployment.`,
      problem_solving: "Structured their thoughts well, identifying trade-offs in scale and speed, although optimizations under low memory limits could be improved.",
      communication: "Maintained a steady pacing of ~130 WPM with clear articulation. Minimal filler words used.",
      role_readiness: `Fits the ${experienceLevel} profile well. Solid engineering foundations and ready to commit code under supervision.`,
      company_readiness: `Demonstrates alignment with ${company}'s core principles (${company === 'Google' ? 'algorithmic scaling' : company === 'OpenAI' ? 'research mindset' : 'hardware efficiency'}).`
    },
    competency_scores: compScores,
    claim_vs_demonstrated: claimsCompared,
    failure_points: [
      `Inability to formulate low-level performance tradeoffs under heavy GPU caching parameters (Critical for ${company}).`,
      "Shallow answers when pressed on mathematical proofs and convergence details."
    ],
    strengths: [
      "Excellent communication clarity and structured thinking under technical questioning.",
      "Good familiarity with development workflows and container tooling.",
      "Strong grasp of core data structures and index optimizations."
    ],
    weaknesses: [
      "Struggled to articulate distributed transaction handling mechanisms (Saga/2PC).",
      "Limited depth on custom hardware memory scheduling limitations.",
      "Slow response times when adjusting algorithm parameters to lower spatial complexity."
    ],
    missing_skills: [
      role === 'AI/ML Engineer' ? 'CUDA Programming' : 'Distributed Consensus Protocols',
      'Advanced Network Telemetry'
    ],
    learning_recommendations: [
      `Review: ${role === 'AI/ML Engineer' ? 'Deep Learning (Goodfellow et al.) Attention section' : 'Designing Data-Intensive Applications (Martin Kleppmann)'}.`,
      `Read: ${company} whitepapers and technical blog posts regarding recent model deployments.`
    ]
  };
}
