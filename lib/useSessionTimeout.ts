"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const DEFAULT_TIMEOUT_MINUTES = 30;
const EVENTS = ["mousedown", "keydown", "scroll", "touchstart"];

/**
 * Logs the user out after a period of inactivity. Use on protected pages (e.g. dashboard).
 * Redirects to login with message=session_expired.
 */
export function useSessionTimeout(minutes: number = DEFAULT_TIMEOUT_MINUTES) {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef(Date.now());

  const logout = useCallback(() => {
    supabase.auth.signOut();
    router.replace("/login?message=session_expired");
    router.refresh();
  }, [router]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      logout();
    }, minutes * 60 * 1000);
  }, [minutes, logout]);

  useEffect(() => {
    resetTimer();
    const handleActivity = () => resetTimer();
    EVENTS.forEach((event) => window.addEventListener(event, handleActivity));
    return () => {
      EVENTS.forEach((event) => window.removeEventListener(event, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [resetTimer]);
}
