import { StockData } from '@/types';

export async function getStockQuote(symbol: string): Promise<StockData> {
  const response = await fetch(`/api/stock-quote?symbol=${encodeURIComponent(symbol)}`);
  if (!response.ok) {
    const errorData = await response.json();
    if (response.status === 403) {
      throw new Error('Invalid API key or symbol');
    }
    if (response.status === 500) {
      throw new Error(errorData.error || 'Failed to fetch stock quote due to server error');
    }
    throw new Error(`Failed to fetch quote for ${symbol}`);
  }
  return response.json();
}