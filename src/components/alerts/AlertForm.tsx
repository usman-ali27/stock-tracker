'use client';

import { useState, useEffect } from 'react';
import { saveAlert } from '@/lib/firestore';
import { AlertSettings } from '@/types';

interface AlertFormProps {
  symbol: string;
  userId: string;
  currentPrice: number;
}

export default function AlertForm({ symbol, userId, currentPrice }: AlertFormProps) {
  const [threshold, setThreshold] = useState(currentPrice);
  const [isAbove, setIsAbove] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setThreshold(currentPrice);
  }, [currentPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const alert: AlertSettings = {
      userId,
      symbol,
      threshold,
      isAbove,
      isActive: true,
      createdAt: new Date(),
    };

    try {
      await saveAlert(alert);
      setSuccessMessage(`Alert created for ${symbol} ${isAbove ? 'above' : 'below'} $${threshold.toFixed(2)}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to create alert:', error);
      setSuccessMessage('Failed to create alert. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded animate-fadeIn">
          {successMessage}
        </div>
      )}
      <div>
        <label htmlFor="symbol" className="block text-sm font-medium text-gray-300">
          Stock Symbol
        </label>
        <input
          type="text"
          id="symbol"
          value={symbol}
          readOnly
          className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-300"
        />
      </div>
      <div>
        <label htmlFor="threshold" className="block text-sm font-medium text-gray-300">
          Price Threshold ($)
        </label>
        <input
          type="number"
          id="threshold"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          step="0.01"
          min="0"
          required
          className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-300"
        />
      </div>
      <div>
        <label htmlFor="direction" className="block text-sm font-medium text-gray-300">
          Direction
        </label>
        <select
          id="direction"
          value={isAbove ? 'above' : 'below'}
          onChange={(e) => setIsAbove(e.target.value === 'above')}
          className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-300"
        >
          <option value="above">Above</option>
          <option value="below">Below</option>
        </select>
      </div>
      <button
        type="submit"
        className="w-full py-2 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-md"
      >
        Create Alert
      </button>
    </form>
  );
}
