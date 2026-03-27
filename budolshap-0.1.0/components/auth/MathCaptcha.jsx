import React, { useState, useEffect } from 'react';

/**
 * MathCaptcha component
 * WHY: To prevent automated registrations (bots) by requiring a simple math challenge.
 * WHAT: Generates a single-digit addition or subtraction problem.
 * TODO: Add a "Refresh" button for the challenge.
 */
export default function MathCaptcha({ onSolve, primaryColor = 'blue' }) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [operator, setOperator] = useState('+');
    const [userAnswer, setUserAnswer] = useState('');
    const [error, setError] = useState(false);

    const generateChallenge = () => {
        const n1 = Math.floor(Math.random() * 9) + 1;
        const n2 = Math.floor(Math.random() * 9) + 1;
        const op = Math.random() > 0.5 ? '+' : '-';
        
        // Ensure result is not negative for simplicity
        if (op === '-' && n1 < n2) {
            setNum1(n2);
            setNum2(n1);
        } else {
            setNum1(n1);
            setNum2(n2);
        }
        setOperator(op);
        setUserAnswer('');
        setError(false);
    };

    useEffect(() => {
        generateChallenge();
    }, []);

    const verifyAnswer = () => {
        const correctAnswer = operator === '+' ? num1 + num2 : num1 - num2;
        if (parseInt(userAnswer) === correctAnswer) {
            onSolve();
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };

    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700',
        rose: 'bg-rose-600 hover:bg-rose-700',
    };

    return (
        <div className="p-6 bg-slate-50 rounded-xl border-2 border-slate-100 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4">
                <div className={`p-2 rounded-lg ${primaryColor === 'rose' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h3 className="font-bold text-slate-800">Budol Shield</h3>
            </div>
            
            <p className="text-sm text-slate-500 mb-4 font-medium">Please solve this simple problem to continue:</p>
            
            <div className="space-y-4">
                <div className="flex items-center justify-center gap-4 text-2xl font-black text-slate-900 bg-white p-4 rounded-lg border border-slate-200">
                    <span>{num1}</span>
                    <span className="text-slate-400">{operator}</span>
                    <span>{num2}</span>
                    <span className="text-slate-400">=</span>
                    <input
                        type="number"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                verifyAnswer();
                            }
                        }}
                        className={`w-20 text-center border-2 rounded-lg focus:outline-none transition-all ${
                            error ? 'border-red-500 bg-red-50 animate-shake' : 'border-slate-200 focus:border-blue-500'
                        }`}
                        placeholder="?"
                        autoFocus
                        required
                    />
                </div>
                
                {error && <p className="text-xs text-red-500 text-center font-bold">Incorrect answer. Please try again.</p>}
                
                <button
                    type="button"
                    onClick={() => {
                        verifyAnswer();
                    }}
                    className={`w-full py-3 text-white font-bold rounded-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${colorClasses[primaryColor] || colorClasses.blue}`}
                >
                    Verify & Proceed
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
            
            <p className="text-[10px] text-slate-400 mt-4 text-center uppercase tracking-widest font-bold">Bot Protection Verified</p>
        </div>
    );
}
