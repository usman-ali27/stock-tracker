"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { subscribeToAlerts } from '@/lib/firestore';
import { AlertSettings } from '@/types';
import AlertForm from '@/components/alerts/AlertForm';
import { getStockQuote } from '@/lib/stockApi';

export default function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [currentPrice, setCurrentPrice] = useState(0);

  useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToAlerts(user.uid, (alertData) => {
      setAlerts(alertData);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const quote = await getStockQuote(selectedStock);
        if (typeof quote.price === 'number') {
          setCurrentPrice(quote.price);
        } else {
          console.warn(`Invalid price for ${selectedStock}: ${quote.price}`);
          setCurrentPrice(0);
        }
      } catch (error) {
        console.error('Failed to fetch price:', error);
        setCurrentPrice(0);
      }
    };

    fetchPrice();
  }, [selectedStock]);

  if (!user) return null;

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-purple-400 neon-text">Price Alerts</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-purple-400 neon-text">Price Alerts</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl border border-gray-700 glow-effect">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">Create New Alert</h2>
          <AlertForm
            symbol={selectedStock}
            userId={user.uid}
            currentPrice={currentPrice}
          />
        </div>
      
        <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl border border-gray-700 glow-effect">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">Active Alerts</h2>
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          ) : alerts.length === 0 ? (
            <p className="text-gray-400">No alerts configured</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-cyan-400 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-cyan-400">{alert.symbol}</span>
                      <span className="ml-3 text-gray-300">
                        {alert.isAbove ? '🚀 Above' : '📉 Below'} ${alert.threshold.toFixed(2)}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded ${alert.isActive ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                      {alert.isActive ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}