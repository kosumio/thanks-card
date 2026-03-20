"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "tc_read_cards";

interface ReadStatusContextType {
  isUnread: (cardId: string) => boolean;
  unreadCount: number;
  markAsRead: (cardIds: string[]) => void;
  setReceivedCardIds: (ids: string[]) => void;
}

const ReadStatusContext = createContext<ReadStatusContextType>({
  isUnread: () => false,
  unreadCount: 0,
  markAsRead: () => {},
  setReceivedCardIds: () => {},
});

export function ReadStatusProvider({ children }: { children: React.ReactNode }) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [receivedIds, setReceivedIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  // localStorage から既読IDを復元
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      }
    } catch {}
    setLoaded(true);
  }, []);

  // 既読IDを永続化
  const persist = useCallback((ids: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    } catch {}
  }, []);

  const isUnread = useCallback(
    (cardId: string) => {
      if (!loaded) return false;
      return !readIds.has(cardId);
    },
    [readIds, loaded]
  );

  const unreadCount = loaded
    ? receivedIds.filter((id) => !readIds.has(id)).length
    : 0;

  const markAsRead = useCallback(
    (cardIds: string[]) => {
      setReadIds((prev) => {
        const next = new Set(prev);
        cardIds.forEach((id) => next.add(id));
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const setReceivedCardIds = useCallback((ids: string[]) => {
    setReceivedIds(ids);
  }, []);

  return (
    <ReadStatusContext.Provider
      value={{ isUnread, unreadCount, markAsRead, setReceivedCardIds }}
    >
      {children}
    </ReadStatusContext.Provider>
  );
}

export function useReadStatus() {
  return useContext(ReadStatusContext);
}
