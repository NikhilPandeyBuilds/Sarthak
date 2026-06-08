import { NextResponse } from 'next/server';
import { getSession, getReport, getQuestionHistory } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { sessionId } = resolvedParams;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId parameter' }, { status: 400 });
    }

    console.log(`[SAKSHAT.API] Fetching report for Session ${sessionId}`);
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const report = await getReport(sessionId);
    if (!report && session.status === 'completed') {
      return NextResponse.json({ error: 'Report is still being generated. Please retry shortly.' }, { status: 202 });
    }

    const history = await getQuestionHistory(sessionId);

    return NextResponse.json({
      success: true,
      session,
      report,
      history
    });
  } catch (error) {
    console.error('[SAKSHAT.API] Get Report API Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve report. ' + error.message },
      { status: 500 }
    );
  }
}
