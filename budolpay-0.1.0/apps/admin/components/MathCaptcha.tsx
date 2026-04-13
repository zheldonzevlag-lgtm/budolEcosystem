'use client';
import React, { useState, useEffect, useCallback } from 'react';

/**
 * MathCaptcha component
 * WHY: To prevent automated bot registrations by requiring a simple math challenge.
 * WHAT: Generates a single-digit addition or subtraction problem.
 *
 * HYDRATION FIX (v2.4.7):
 *   - Math.random() produces different values on server vs client, causing React
 *     hydration mismatch (Error: Text content did not match. Server: "8" Client: "9").
 *   - Solution: Initialize state as null, generate challenge ONLY after client mount
 *     via useEffect. Show a neutral placeholder until mounted.
 *   - Also fixed: parseInt('') === NaN causing silent Verify Challenge failures.
 */
interface MathCaptchaProps {
    onSolve: () => void;
    primaryColor?: 'blue' | 'rose';
}

interface Challenge {
    num1: number;
    num2: number;
    operator: string;
}

function createChallenge(): Challenge {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    const op = Math.random() > 0.5 ? '+' : '-';
    // Ensure result is non-negative
    if (op === '-' && n1 < n2) {
        return { num1: n2, num2: n1, operator: op };
    }
    return { num1: n1, num2: n2, operator: op };
}

export default function MathCaptcha({ onSolve, primaryColor = 'blue' }: MathCaptchaProps) {
    // WHY: null initial state so server renders a neutral placeholder.
    //      Math.random() only runs after hydration (in useEffect), preventing
    //      the "Text content did not match" hydration error.
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [error, setError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // WHY: Generate challenge only on client after mount — never on server.
    //      This is the standard Next.js pattern for any component using Math.random().
    useEffect(() => {
        setChallenge(createChallenge());
    }, []);

    const regenerate = useCallback(() => {
        setChallenge(createChallenge());
        setUserAnswer('');
        setError(false);
        setErrorMsg('');
    }, []);

    const verifyAnswer = useCallback(() => {
        if (!challenge) return;

        const trimmed = userAnswer.trim();

        // WHY: parseInt('') === NaN which never equals any number,
        //      causing Verify to appear broken. Guard empty input explicitly.
        if (trimmed === '') {
            setError(true);
            setErrorMsg('Please enter your answer.');
            setTimeout(() => setError(false), 2000);
            return;
        }

        const parsed = parseInt(trimmed, 10);
        const correctAnswer = challenge.operator === '+'
            ? challenge.num1 + challenge.num2
            : challenge.num1 - challenge.num2;

        if (parsed === correctAnswer) {
            onSolve();
        } else {
            setError(true);
            setErrorMsg('Incorrect. Try again.');
            // Auto-regenerate a fresh challenge after a short delay
            setTimeout(() => {
                setError(false);
                setErrorMsg('');
                regenerate();
            }, 1500);
        }
    }, [userAnswer, challenge, onSolve, regenerate]);

    const colorClasses = {
        blue: 'bg-slate-900 hover:bg-slate-800',
        rose: 'bg-rose-600 hover:bg-rose-700',
    };

    return (
        <div className="p-6 bg-slate-50 rounded-xl border-2 border-slate-100 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4">
                <div className={`p-2 rounded-lg ${primaryColor === 'rose' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-700'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Budol Shield Verification</h3>
            </div>

            <p className="text-xs text-slate-500 mb-4 font-medium italic">Complete this challenge to unlock sign-in:</p>

            <div className="space-y-4">
                {/* WHY: Render a static placeholder on server/before mount.
                        Once challenge is set (client-only), show the real problem.
                        This guarantees server and client HTML are identical on first render. */}
                <div className={`flex items-center justify-center gap-4 text-2xl font-black text-slate-900 bg-white p-4 rounded-lg border-2 shadow-inner transition-all ${
                    error ? 'border-red-400 bg-red-50' : 'border-slate-200'
                }`}>
                    {challenge ? (
                        <>
                            <span>{challenge.num1}</span>
                            <span className="text-slate-400">{challenge.operator}</span>
                            <span>{challenge.num2}</span>
                            <span className="text-slate-400">=</span>
                        </>
                    ) : (
                        /* Server placeholder — static, matches client placeholder until useEffect fires */
                        <span className="text-slate-300 text-sm font-normal tracking-wider">Loading challenge...</span>
                    )}
                    <input
                        type="number"
                        value={userAnswer}
                        disabled={!challenge}
                        onChange={(e) => {
                            setUserAnswer(e.target.value);
                            setError(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                verifyAnswer();
                            }
                        }}
                        className={`w-20 text-center border-2 rounded-lg focus:outline-none transition-all p-1 disabled:opacity-40 ${
                            error ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-rose-500'
                        }`}
                        placeholder="?"
                        autoFocus={!!challenge}
                    />
                </div>

                {/* Error feedback */}
                {error && errorMsg && (
                    <p className="text-[10px] text-red-500 text-center font-bold uppercase tracking-wider animate-pulse">
                        {errorMsg}
                    </p>
                )}

                <button
                    type="button"
                    disabled={!challenge}
                    onClick={(e) => {
                        e.preventDefault();
                        verifyAnswer();
                    }}
                    className={`w-full py-3 text-white text-sm font-bold rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses[primaryColor] || colorClasses.blue}`}
                >
                    Verify Challenge
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* v2.4.3: E2E Test Bypass (Development Only) */}
                {process.env.NODE_ENV === 'development' && (
                    <button
                        type="button"
                        id="e2e-bypass-captcha"
                        onClick={() => onSolve()}
                        className="mt-4 w-full py-1 text-[8px] text-slate-400 font-bold uppercase tracking-[0.3em] hover:text-rose-500 transition-colors"
                    >
                        [ Bypass for Automated Test ]
                    </button>
                )}
            </div>

            <p className="text-[10px] text-slate-400 mt-4 text-center uppercase tracking-widest font-bold">Bot Protection Verified</p>
        </div>
    );
}
