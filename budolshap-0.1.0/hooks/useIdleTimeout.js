import { useState, useEffect, useCallback, useRef } from 'react';

const EVENTS = ['mousemove', 'keydown', 'wheel', 'touchmove', 'click'];

/**
 * Hook to handle idle timeout
 * @param {Object} options
 * @param {number} options.timeoutMs - Time in ms before logout (default 15 mins)
 * @param {number} options.warningMs - Time in ms before warning (default 14 mins)
 * @param {Function} options.onIdle - Callback to execute when idle timeout is reached
 */
export function useIdleTimeout({
    timeoutMs = 15 * 60 * 1000,
    warningMs = 14 * 60 * 1000,
    onIdle
}) {
    const [isIdle, setIsIdle] = useState(false);
    const [isWarning, setIsWarning] = useState(false);
    const lastActivityRef = useRef(Date.now());
    const warningTimerRef = useRef(null);
    const logoutTimerRef = useRef(null);

    // Reset timer on activity
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

    // Initialize listeners
    useEffect(() => {
        const handleActivity = () => {
            // throttle resets to avoid performance issues
            // only reset if at least 1 second has passed since last recorded activity
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
