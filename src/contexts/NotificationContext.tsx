import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  read?: boolean;
  created_at?: string;
  key?: string | null;
  params?: Record<string, unknown> | null;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  markAsRead: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!profile?.id) {
      setNotifications([]);
      return;
    }

    const col = collection(db, 'notifications');
    const q = query(col, where('recipient_id', '==', profile.id));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as NotificationItem[];
      items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      setNotifications(items);
    }, (err) => console.error('Notifications error', err));

    return () => unsub();
  }, [profile?.id]);

  const markAsRead = async (id: string) => {
    const d = doc(db, 'notifications', id);
    await updateDoc(d, { read: true });
  };

  return (
    <NotificationContext.Provider value={{ notifications, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
