'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Notification {
  id: string;
  symbol: string;
  price: number;
  threshold: number;
  type: 'PRICE_ABOVE' | 'PRICE_BELOW';
  createdAt?: Date;
}

export default function NotificationList({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentNotification, setRecentNotification] = useState<Notification | null>(null);

  // Subscribe to notifications
  useEffect(() => {
    if (!userId) {
      console.log('NotificationList: No userId, skipping subscription');
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Notification[];

      // Check for new notifications
      if (notificationData.length > notifications.length && notificationData.length > 0) {
        const latestNotification = notificationData[0];
        setRecentNotification(latestNotification);
      }

      setNotifications(notificationData);
    }, (error) => {
      console.error('Failed to fetch notifications:', error);
    });

    return () => unsubscribe();
  }, [userId, notifications.length]);

  // Auto-dismiss recent notification after 5 seconds
  useEffect(() => {
    if (!recentNotification) return;

    const timer = setTimeout(() => {
      setRecentNotification(null);
    }, 5000);

    // Clean up the timer when a new notification arrives or the component unmounts
    return () => clearTimeout(timer);
  }, [recentNotification]);

  const dismissNotification = () => {
    setRecentNotification(null);
  };

  const formatDate = (date?: Date): string => {
    return date ? date.toLocaleString() : 'Unknown time';
  };

  // Portal for rendering the popover at the root of the DOM
  const Popover = () => {
    if (!recentNotification) return null;

    return createPortal(
      <div className="fixed top-4 right-4 z-[1000] max-w-full w-auto p-4 bg-gray-800 border border-gray-700 rounded-lg shadow-lg animate-slideIn">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-lg font-semibold text-cyan-400">{recentNotification.symbol} Alert</h4>
            <p className="text-sm text-gray-300">
              Price reached ${recentNotification.price.toFixed(2)} (
              {recentNotification.type === 'PRICE_ABOVE' ? 'above' : 'below'} $
              {recentNotification.threshold.toFixed(2)})
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(recentNotification.createdAt)}
            </p>
          </div>
          <button
            onClick={dismissNotification}
            className="ml-4 text-gray-400 hover:text-gray-200 focus:outline-none"
          >
            ✕
          </button>
        </div>
      </div>,
      document.body // Render at the root of the DOM
    );
  };

  return (
    <div className="space-y-4">
      {/* Render the popover via a portal */}
      <Popover />

      {/* Notification History */}
      <h3 className="text-lg font-medium text-cyan-400">Alert History</h3>
      {notifications.length === 0 ? (
        <p className="text-gray-400">No notifications yet</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="p-3 border border-gray-700 rounded-lg bg-gray-800/50 transition-all duration-300 opacity-0 animate-fadeIn"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-white">{notification.symbol}</span>
                <span className="text-gray-500 text-sm">
                  {formatDate(notification.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-1">
                Price reached ${notification.price.toFixed(2)} (
                {notification.type === 'PRICE_ABOVE' ? 'above' : 'below'} $
                {notification.threshold.toFixed(2)})
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}