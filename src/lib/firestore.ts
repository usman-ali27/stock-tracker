import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertSettings } from '@/types';

export async function saveAlert(alert: AlertSettings) {
  try {
    await addDoc(collection(db, 'alerts'), alert);
  } catch (err) {
    console.error('Failed to save alert:', err);
    throw err;
  }
}

export function subscribeToAlerts(userId: string, callback: (alerts: AlertSettings[]) => void) {
  const q = query(collection(db, 'alerts'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AlertSettings));
    callback(alerts);
  }, (err) => {
    console.error('Failed to fetch alerts:', {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
  });
}