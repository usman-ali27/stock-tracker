'use client';

import { StockData } from '@/types';

interface StockListProps {
  stocks: StockData[];
  selectedSymbol: string;
  onSelectStock: (symbol: string) => void;
}

export default function StockList({
  stocks,
  selectedSymbol,
  onSelectStock,
}: StockListProps) {
  return (
    <div className="space-y-2">
      {stocks.map((stock) => (
        // Use stock.symbol ?? 'UNKNOWN' to provide a fallback
        <button
          key={stock.symbol ?? 'UNKNOWN'}
          className={`w-full text-left p-4 rounded-lg transition ${stock.symbol === selectedSymbol
            ? 'bg-cyan-700 text-white'
            : 'bg-gray-700 hover:bg-gray-600'
            }`}
          onClick={() => onSelectStock(stock.symbol ?? 'UNKNOWN')}
        >
          <div className="flex justify-between">
            <span className="text-lg font-semibold">{stock.symbol ?? 'N/A'}</span>
            <span
              className={`text-sm ${stock.change && stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {stock.change !== null && stock.change !== undefined
                ? `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}`
                : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>
              {stock.price !== null && stock.price !== undefined
                ? `$${stock.price.toFixed(2)}`
                : 'N/A'}
            </span>
            <span>
              {stock.percentChange !== null && stock.percentChange !== undefined
                ? `${stock.percentChange >= 0 ? '+' : ''}${stock.percentChange.toFixed(2)}%`
                : 'N/A'}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}