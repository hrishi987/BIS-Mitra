"use client";

/**
 * Session store — keeps the current product context, retrieval packet,
 * consumer record and conversation alive across page changes *and* full page
 * refreshes (the demo does a lot of refreshing).
 *
 * No state library: a small context plus localStorage, so the bundle stays
 * small and there is nothing to configure.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  ChatMessage,
  ConsumerLookup,
  Language,
  RetrievalPacket,
} from "./types";

const KEY = "bis-mitra.session.v2";

interface Session {
  packet: RetrievalPacket | null;
  consumer: ConsumerLookup | null;
  messages: ChatMessage[];
  language: Language;
}

const EMPTY: Session = {
  packet: null,
  consumer: null,
  messages: [],
  language: "en",
};

interface SessionApi extends Session {
  setPacket: (p: RetrievalPacket | null) => void;
  setConsumer: (c: ConsumerLookup | null) => void;
  setMessages: (m: ChatMessage[] | void | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  pushMessage: (m: ChatMessage) => void;
  setLanguage: (l: Language) => void;
  clearConversation: () => void;
  hydrated: boolean;
}

const Ctx = createContext<SessionApi | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Session>;
        setSession({
          packet: parsed.packet ?? null,
          consumer: parsed.consumer ?? null,
          messages: Array.isArray(parsed.messages) ? parsed.messages : [],
          language: parsed.language ?? "en",
        });
      }
    } catch {
      /* corrupt storage is not worth surfacing — start fresh */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(session));
    } catch {
      /* quota / private mode — session simply will not survive a refresh */
    }
  }, [session, hydrated]);

  const setPacket = useCallback((p: RetrievalPacket | null) => {
    setSession((s) => ({ ...s, packet: p }));
  }, []);

  const setConsumer = useCallback((c: ConsumerLookup | null) => {
    setSession((s) => ({ ...s, consumer: c }));
  }, []);

  const setMessages = useCallback(
    (m: ChatMessage[] | void | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setSession((s) => ({
        ...s,
        messages: typeof m === "function" ? m(s.messages) : (m ?? s.messages),
      }));
    },
    [],
  );

  const pushMessage = useCallback((m: ChatMessage) => {
    setSession((s) => ({ ...s, messages: [...s.messages, m] }));
  }, []);

  const setLanguage = useCallback((l: Language) => {
    setSession((s) => ({ ...s, language: l }));
  }, []);

  const clearConversation = useCallback(() => {
    setSession((s) => ({ ...s, messages: [] }));
  }, []);

  const value = useMemo<SessionApi>(
    () => ({
      ...session,
      setPacket,
      setConsumer,
      setMessages,
      pushMessage,
      setLanguage,
      clearConversation,
      hydrated,
    }),
    [session, setPacket, setConsumer, setMessages, pushMessage, setLanguage, clearConversation, hydrated],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
