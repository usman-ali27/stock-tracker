import { NextResponse } from 'next/server';

const DEFAULT_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN'];

export async function GET() {
  return NextResponse.json(DEFAULT_SYMBOLS);
}