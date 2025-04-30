import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 });
  }
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${process.env.FINNHUB_API_KEY}`
    );
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Finnhub API error for ${symbol}: ${response.status} - ${errorText}`);
      if (response.status === 403) {
        return NextResponse.json({ error: 'Invalid API key or symbol' }, { status: 403 });
      }
      throw new Error('Failed to fetch quote');
    }
    const data = await response.json();
    return NextResponse.json({
      symbol,
      price: data.c,
      previousClose: data.pc,
      change: data.d,
      percentChange: data.dp,
    });
  } catch (error: any) {
    console.error('Stock quote fetch error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch stock quote: ' + error.message },
      { status: 500 }
    );
  }
}