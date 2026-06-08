import { NextResponse } from 'next/server';
import { getGeminiStatus } from '@/lib/gemini';

export async function GET() {
  const status = getGeminiStatus();
  return NextResponse.json({
    success: true,
    ...status,
  });
}
