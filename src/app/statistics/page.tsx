'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserStats } from '@/types';
import { Timestamp } from 'firebase/firestore';

export default function Statistics() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !user.uid) {
      console.log('Statistics: No user or user.uid, skipping fetch');
      setError('Please sign in to view statistics');
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const q = query(
          collection(db, 'statistics'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        console.log('Statistics snapshot:', {
          isEmpty: snapshot.empty,
          docCount: snapshot.docs.length,
          docs: snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })),
        });

        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          setStats({
            ...docData,
            lastUpdated: docData.lastUpdated instanceof Timestamp
              ? docData.lastUpdated.toDate()
              : new Date(docData.lastUpdated),
          } as UserStats);
        } else {
          console.log('No statistics documents found for user:', user.uid);
        }
      } catch (error: any) {
        console.error('Failed to fetch statistics:', error.message, {
          code: error.code,
          details: error.details,
          userId: user.uid,
        });
        setError('Failed to load statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-green-400 neon-text">API Analytics</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">Please sign in to access statistics</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-green-400 neon-text">API Analytics</h1>

      <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl border border-gray-700 glow-effect">
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : !stats ? (
          <p >No analytics data available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <h2 className="text-sm font-mono text-gray-400">TOTAL REQUESTS</h2>
              <p className="text-3xl font-bold text-green-400 mt-2">{stats.apiCalls}</p>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <h2 className="text-sm font-mono text-gray-400">LAST SYNC</h2>
              <p className="text-gray-300 mt-2">
                {stats.lastUpdated.toLocaleString('en-US', {
                  hour12: true,
                  hour: 'numeric',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}