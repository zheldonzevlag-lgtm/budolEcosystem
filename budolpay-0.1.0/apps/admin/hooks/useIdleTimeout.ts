import { useState, useEffect, useCallback, useRef } from 'react';

const EVENTS = ['mousemove', 'keydown', 'wheel', 'touchmove', 'click'];

interface IdleTimeoutOptions {
  timeoutMs?: number;
  warningMs?: number;
  onIdle?: () => void;
}

/**
 * Hook to handle idle timeout
 */
export function useIdleTimeout({
  timeoutMs = 15 * 60 * 1000,
  warningMs = 14 * 60 * 1000,
  onIdle
}: IdleTimeoutOptions) {
  const [isIdle, setIsIdle] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    setIsIdle(false);
    setIsWarning(false);
    lastActivityRef.current = Date.now();

    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

    // Set warning timer
    warningTimerRef.current = setTimeout(() => {
      setIsWarning(true);
    }, warningMs);

    // Set logout timer
    logoutTimerRef.current = setTimeout(() => {
      setIsIdle(true);
      if (onIdle) onIdle();
    }, timeoutMs);
  }, [timeoutMs, warningMs, onIdle]);

  useEffect(() => {
    const handleActivity = () => {
      // throttle resets to avoid performance issues
      if (Date.now() - lastActivityRef.current > 1000) {
        resetTimer();
      }
    };

    // Bind events
    EVENTS.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Start initial timer
    resetTimer();

    return () => {
      EVENTS.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [resetTimer]);

  return {
    isIdle,
    isWarning,
    resetTimer
  };
}
