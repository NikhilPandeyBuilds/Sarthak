import fs from 'fs';
import path from 'path';

// Check for Supabase config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isSupabaseConfigured = supabaseUrl && supabaseKey;

let supabase = null;
if (isSupabaseConfigured) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[SAKSHAT.DB] Supabase Client Initialized.');
  } catch (err) {
    console.warn('[SAKSHAT.DB] Supabase import failed. Falling back to local file storage.', err);
  }
}

// Local File Database Fallback
const dbFilePath = path.join(process.cwd(), 'db.json');

// Initialize local file database structure
function initLocalDb() {
  if (!fs.existsSync(dbFilePath)) {
    const emptyDb = {
      resumes: [],
      sessions: [],
      questions: [],
      reports: []
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(emptyDb, null, 2), 'utf-8');
  }
}

function readLocalDb() {
  initLocalDb();
  const fileData = fs.readFileSync(dbFilePath, 'utf-8');
  try {
    return JSON.parse(fileData);
  } catch (err) {
    console.error('Error parsing local db.json, resetting database.', err);
    return { resumes: [], sessions: [], questions: [], reports: [] };
  }
}

function writeLocalDb(data) {
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

// -------------------------------------------------------------
// EXPORTED DB FUNCTIONS
// -------------------------------------------------------------

export async function saveResume(rawText, analysis) {
  const newResume = {
    id: crypto.randomUUID(),
    raw_text: rawText,
    analysis: analysis,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('resumes')
      .insert([newResume])
      .select();
    if (error) throw error;
    return data[0];
  } else {
    const db = readLocalDb();
    db.resumes.push(newResume);
    writeLocalDb(db);
    return newResume;
  }
}

export async function getResume(id) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readLocalDb();
    return db.resumes.find(r => r.id === id) || null;
  }
}

export async function createSession(resumeId, company, role, experienceLevel, claimedSkills = []) {
  const newSession = {
    id: crypto.randomUUID(),
    resume_id: resumeId,
    company: company,
    role: role,
    experience_level: experienceLevel,
    status: 'ongoing',
    competency_scores: {},
    claimed_skills: claimedSkills,
    weaknesses_log: [],
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('interview_sessions')
      .insert([newSession])
      .select();
    if (error) throw error;
    return data[0];
  } else {
    const db = readLocalDb();
    db.sessions.push(newSession);
    writeLocalDb(db);
    return newSession;
  }
}

export async function getSession(id) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readLocalDb();
    return db.sessions.find(s => s.id === id) || null;
  }
}

export async function updateSessionState(id, updates) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('interview_sessions')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  } else {
    const db = readLocalDb();
    const sessionIndex = db.sessions.findIndex(s => s.id === id);
    if (sessionIndex === -1) throw new Error('Session not found');
    
    db.sessions[sessionIndex] = {
      ...db.sessions[sessionIndex],
      ...updates
    };
    writeLocalDb(db);
    return db.sessions[sessionIndex];
  }
}

export async function addQuestionExchange({
  sessionId,
  questionNumber,
  competency,
  origin,
  difficultyLevel,
  questionText,
  adaptationLog
}) {
  const newQuestion = {
    id: crypto.randomUUID(),
    session_id: sessionId,
    question_number: questionNumber,
    competency,
    origin,
    difficulty_level: difficultyLevel,
    question_text: questionText,
    answer_text: null,
    evaluation: null,
    communication_analysis: null,
    adaptation_log: adaptationLog,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('question_history')
      .insert([newQuestion])
      .select();
    if (error) throw error;
    return data[0];
  } else {
    const db = readLocalDb();
    db.questions.push(newQuestion);
    writeLocalDb(db);
    return newQuestion;
  }
}

export async function updateQuestionAnswer(questionId, answerText, evaluation, communicationAnalysis) {
  const updates = {
    answer_text: answerText,
    evaluation: evaluation,
    communication_analysis: communicationAnalysis
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('question_history')
      .update(updates)
      .eq('id', questionId)
      .select();
    if (error) throw error;
    return data[0];
  } else {
    const db = readLocalDb();
    const questionIndex = db.questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) throw new Error('Question not found');

    db.questions[questionIndex] = {
      ...db.questions[questionIndex],
      ...updates
    };
    writeLocalDb(db);
    return db.questions[questionIndex];
  }
}

export async function getQuestionHistory(sessionId) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('question_history')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_number', { ascending: true });
    if (error) throw error;
    return data;
  } else {
    const db = readLocalDb();
    return db.questions
      .filter(q => q.session_id === sessionId)
      .sort((a, b) => a.question_number - b.question_number);
  }
}

export async function saveReport(reportData) {
  // Ensure session_id matches table naming convention
  const newReport = {
    id: crypto.randomUUID(),
    ...reportData,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('reports')
      .insert([newReport])
      .select();
    if (error) throw error;
    return data[0];
  } else {
    const db = readLocalDb();
    // Remove duplicates if any exist for the same session
    db.reports = db.reports.filter(r => r.session_id !== reportData.session_id);
    db.reports.push(newReport);
    writeLocalDb(db);
    return newReport;
  }
}

export async function getReport(sessionId) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    if (error) return null;
    return data;
  } else {
    const db = readLocalDb();
    return db.reports.find(r => r.session_id === sessionId) || null;
  }
}
