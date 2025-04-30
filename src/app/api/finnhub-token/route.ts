import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) {
    console.error('FINNHUB_API_KEY is not set in environment variables');
    return NextResponse.json(
      { error: 'API token not configured. Please set FINNHUB_API_KEY in .env' },
      { status: 500 }
    );
  }
  return NextResponse.json({ token });
}