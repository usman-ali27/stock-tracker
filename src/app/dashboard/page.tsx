"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { subscribeToAlerts } from '@/lib/firestore';
import { StockData, AlertSettings } from '@/types';
import { getStockQuote } from '@/lib/stockApi';
import StockChart from '@/components/stocks/StockChart';
import StockList from '@/components/stocks/StockList';
import AlertForm from '@/components/alerts/AlertForm';
import NotificationList from '@/components/alerts/NotificationList';
import { collection, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

const DEFAULT_SYMBOLS = ['AAPL'];

interface ChartData {
  labels: string[];
  prices: number[];
}

interface Notification {
  userId: string;
  symbol: string;
  price: number;
  threshold: number;
  type: 'PRICE_ABOVE' | 'PRICE_BELOW';
  createdAt: any; // Will use serverTimestamp
}

export default function Dashboard() {
  const { user } = useAuth();

  const [stocks, setStocks] = useState<StockData[]>([]);
  const [trackedSymbols, setTrackedSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [selectedStock, setSelectedStock] = useState<string>(DEFAULT_SYMBOLS[0]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [chartData, setChartData] = useState<ChartData>({ labels: [], prices: [] });
  const [alerts, setAlerts] = useState<AlertSettings[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isAudioPreloaded, setIsAudioPreloaded] = useState<boolean>(false);

  // Initialize audio for alert sound
  const alertSound = typeof window !== 'undefined' ? new Audio('/sounds/beep.mp3') : null;

  // Log user state for debugging
  useEffect(() => {
    console.log('Dashboard: User state', { uid: user?.uid, email: user?.email });
    // Force refresh auth token
    if (user) {
      getAuth().currentUser?.getIdToken(true).then(token => {
        console.log('Auth token refreshed:', token);
      }).catch(err => {
        console.error('Failed to refresh auth token:', err);
      });
    }
  }, [user]);

  // Delete an alert from Firestore
  const deleteAlert = async (alertId: string) => {
    if (!user || !user.uid) {
      console.error('Cannot delete alert: User is not authenticated');
      return;
    }
    try {
      await deleteDoc(doc(db, 'alerts', alertId));
      console.log('Alert deleted:', alertId);
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  // Save notification to Firestore
  const saveNotification = async (notification: Omit<Notification, 'createdAt'>) => {
    if (!user || !user.uid) {
      console.error('Cannot save notification: User is not authenticated');
      return;
    }
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: serverTimestamp(),
      });
      console.log('Notification saved:', notification);
    } catch (error) {
      console.error('Failed to save notification:', error);
    }
  };

  // Fetch notification permission and tracked symbols
  useEffect(() => {
    if (!user) return;

    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    } else {
      setNotificationPermission(Notification.permission);
    }

    const fetchTrackedSymbols = async () => {
      try {
        const response = await fetch('/api/tracked-symbols');
        if (!response.ok) throw new Error('Failed to fetch tracked symbols');
        const symbols: string[] = await response.json();
        setTrackedSymbols(symbols.length ? symbols : DEFAULT_SYMBOLS);
      } catch (err) {
        console.error('Failed to load tracked symbols:', err);
        setTrackedSymbols(DEFAULT_SYMBOLS);
      }
    };

    fetchTrackedSymbols();
  }, [user]);

  // Fetch alerts from Firestore
  useEffect(() => {
    if (!user || !user.uid) {
      console.log('Dashboard: No user or user.uid, skipping alerts subscription');
      setAlertsLoading(false);
      setError('Please sign in to view alerts');
      return;
    }

    setAlertsLoading(true);
    const unsubscribe = subscribeToAlerts(user.uid, (alertData) => {
      setAlerts(alertData);
      setAlertsLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch current price for selected stock
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

  // Preload audio on user interaction
  const handleUserInteraction = () => {
    if (!isAudioPreloaded && alertSound) {
      alertSound.muted = true; // Mute to avoid playing sound during preload
      alertSound.play().then(() => {
        alertSound.muted = false; // Unmute after successful preload
        setIsAudioPreloaded(true);
        console.log('Audio preloaded successfully');
      }).catch(err => {
        console.error('Failed to preload audio:', err);
      });
    }
  };

  // Fetch initial stock data and set up polling
  useEffect(() => {
    if (!user || trackedSymbols.length === 0) return;

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const initialData = [];
        for (const symbol of trackedSymbols) {
          try {
            const data = await getStockQuote(symbol);
            if (typeof data.price !== 'number') {
              console.warn(`Invalid price for ${symbol}: ${data.price}`);
              continue;
            }
            initialData.push(data);
          } catch (err: any) {
            console.warn(`Skipping invalid symbol: ${symbol}`, err.message);
            continue;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (initialData.length === 0) {
          throw new Error('No valid stock data available. Please check API key and symbols.');
        }
        setStocks(initialData);
        setSelectedStock(initialData[0]?.symbol || trackedSymbols[0]);
      } catch (err: any) {
        console.error('Failed to load stock data:', err);
        setError(
          err.message.includes('Invalid API key')
            ? 'Invalid Finnhub API key. Please update FINNHUB_API_KEY in .env.'
            : 'Failed to load stock data. Please check API configuration.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    const pollStockData = async () => {
      try {
        const updatedStocks = [];
        for (const symbol of trackedSymbols) {
          try {
            const data = await getStockQuote(symbol);
            if (typeof data.price !== 'number') {
              console.warn(`Invalid price for ${symbol}: ${data.price}`);
              continue;
            }
            updatedStocks.push({
              ...data,
              lastUpdate: Date.now(),
            });

            alerts.forEach(alert => {
              if (
                alert.symbol === data.symbol &&
                alert.userId === user?.uid &&
                alert.isActive &&
                typeof data.price === 'number' &&
                ((alert.isAbove && data.price >= alert.threshold) ||
                 (!alert.isAbove && data.price <= alert.threshold)) &&
                notificationPermission === 'granted'
              ) {
                console.log('Alert triggered:', { symbol: alert.symbol, price: data.price, threshold: alert.threshold });
                // Show browser notification
                new Notification(`Price Alert: ${alert.symbol}`, {
                  body: `${alert.symbol} is ${alert.isAbove ? 'above' : 'below'} $${alert.threshold.toFixed(2)}! Current: $${data.price.toFixed(2)}`,
                  icon: '/favicon.ico',
                });
                // Play alert sound if preloaded
                if (isAudioPreloaded && alertSound) {
                  alertSound.play().catch(err => {
                    console.error('Failed to play alert sound:', err);
                  });
                } else {
                  console.log('Audio not preloaded yet; sound skipped. Notification still shown.');
                }
                // Save notification to Firestore
                saveNotification({
                  userId: user.uid,
                  symbol: alert.symbol,
                  price: data.price,
                  threshold: alert.threshold,
                  type: alert.isAbove ? 'PRICE_ABOVE' : 'PRICE_BELOW',
                });
                setAlerts(prev =>
                  prev.map(a =>
                    a.id === alert.id ? { ...a, isActive: false } : a
                  )
                );
              }
            });
          } catch (err: any) {
            console.warn(`Failed to update ${symbol}:`, err.message);
            continue;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (updatedStocks.length > 0) {
          setStocks(updatedStocks);
        }
      } catch (err: any) {
        console.error('Polling error:', err);
        setError(
          err.message.includes('Invalid API key')
            ? 'Invalid Finnhub API key. Please update FINNHUB_API_KEY in .env.'
            : 'Failed to update stock data. Please check API configuration.'
        );
      }
    };

    const intervalId = setInterval(pollStockData, 10000);
    return () => clearInterval(intervalId);
  }, [user, trackedSymbols, alerts, notificationPermission]);

  // Fetch chart data
  useEffect(() => {
    if (!user || !selectedStock) return;

    const fetchChartData = async () => {
      try {
        const response = await fetch(`/api/chart-data/${encodeURIComponent(selectedStock)}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch chart data for ${selectedStock}`);
        }
        const data: ChartData = await response.json();
        if (
          data.labels.length > 0 &&
          data.prices.length === data.labels.length &&
          data.prices.every(p => typeof p === 'number' && p > 0)
        ) {
          setChartData(data);
          setChartError(null);
        } else {
          throw new Error(`Invalid chart data for ${selectedStock}`);
        }
      } catch (err: any) {
        console.error('Failed to load chart data:', err);
        setChartError(
          err.message.includes('Invalid API key')
            ? 'Invalid Finnhub API key. Please update FINNHUB_API_KEY in .env.'
            : 'Failed to load chart data. Please check API configuration.'
        );
        setChartData({ labels: [], prices: [] });
      }
    };

    fetchChartData();
  }, [user, selectedStock]);

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Stock Tracker</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">Please sign in to access the dashboard</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Stock Tracker</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Tracked Stocks</h2>
          <StockList
            stocks={stocks}
            selectedSymbol={selectedStock}
            onSelectStock={(symbol: string) => {
              setSelectedStock(symbol);
              handleUserInteraction(); // Preload audio on stock selection
            }}
          />
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">{selectedStock} Chart</h2>
          {chartError ? (
            <div className="text-red-400 p-4 text-center">{chartError}</div>
          ) : (
            <StockChart symbol={selectedStock} data={chartData} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
          {alertsLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          ) : alerts.length === 0 ? (
            <p className="text-gray-400">No alerts configured</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id || Math.random().toString()} // Fallback key if alert.id is undefined
                  className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-cyan-400 transition-all duration-300 opacity-0 animate-fadeIn"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-cyan-400">{alert.symbol}</span>
                      <span className="ml-3 text-gray-300">
                        {alert.isAbove ? '🚀 Above' : '📉 Below'} ${alert.threshold.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded ${alert.isActive ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                        {alert.isActive ? 'ACTIVE' : 'PAUSED'}
                      </span>
                      <button
                        onClick={() => alert.id && deleteAlert(alert.id)}
                        disabled={!alert.id}
                        className="text-gray-400 hover:text-gray-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div className="mt-6">
        <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl border border-gray-700 glow-effect">
          <NotificationList userId={user.uid} />
        </div>
      </div>
    </div>
  );
}