import { NextResponse } from 'next/server';
import { saveResume } from '@/lib/db';
import { analyzeResume } from '@/lib/gemini';

export async function POST(request) {
  try {
    const body = await request.json();
    const { resumeText, fileBase64, fileName } = body;

    let contentToAnalyze = resumeText || '';
    let isPdf = false;

    if (fileBase64) {
      // Strip data URL prefixes if present
      contentToAnalyze = fileBase64.replace(/^data:application\/pdf;base64,/, '');
      isPdf = true;
    }

    if (!contentToAnalyze && !resumeText) {
      return NextResponse.json(
        { error: 'No resume content or file uploaded.' },
        { status: 400 }
      );
    }

    console.log(`[SAKSHAT.API] Parsing resume: ${fileName || 'text_paste'}`);
    const analysis = await analyzeResume(contentToAnalyze, isPdf);

    // Persist in DB
    const savedRecord = await saveResume(isPdf ? `[PDF FILE: ${fileName}]` : resumeText, analysis);

    return NextResponse.json({
      success: true,
      resumeId: savedRecord.id,
      analysis: savedRecord.analysis
    });
  } catch (error) {
    console.error('[SAKSHAT.API] Resume Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze resume. ' + error.message },
      { status: 500 }
    );
  }
}
