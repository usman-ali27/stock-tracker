import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: { symbol: string } }) {
  try {
    const { symbol } = context.params;
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

    if (!FINNHUB_API_KEY) {
      console.error('FINNHUB_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'API key not configured. Please set FINNHUB_API_KEY in .env' },
        { status: 500 }
      );
    }

    // Fetch quote data from Finnhub
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`
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

    if (!data || !data.c) {
      return NextResponse.json({ error: 'No data available' }, { status: 404 });
    }

    // Create time-based labels for the last hour (12 5-minute intervals)
    const now = new Date();
    const labels = Array.from({ length: 12 }, (_, i) => {
      const time = new Date(now.getTime() - (11 - i) * 5 * 60000);
      return time.toISOString();
    });

    // Create a price array using current price with small random variations
    const currentPrice = data.c;
    const prices = labels.map(() => {
      const variation = (Math.random() - 0.5) * 2; // ±1% variation
      return +(currentPrice + currentPrice * (variation / 100)).toFixed(2);
    });

    // Transform the data for the chart
    const chartData = {
      labels,
      prices,
    };

    return NextResponse.json(chartData);
  } catch (error: any) {
    console.error('Chart data fetch error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch chart data: ' + error.message },
      { status: 500 }
    );
  }
}