
'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { Notification } from '@/lib/data-structures';
import { getNotifications } from '@/services/firestore';
import { useToast } from './use-toast';
import { onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  refetch: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isLoading: true,
  refetch: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedNotifications = await getNotifications();
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load notifications.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setIsLoading(true);
    const notificationsCollection = collection(db, 'notifications');
    const q = query(notificationsCollection, orderBy('createdAt', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        setNotifications(JSON.parse(JSON.stringify(fetchedNotifications)));
        setIsLoading(false);
    }, (error) => {
        console.error("Failed to subscribe to notifications:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not subscribe to live notification updates.',
        });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);
  
  const value = {
    notifications,
    unreadCount,
    isLoading,
    refetch: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
