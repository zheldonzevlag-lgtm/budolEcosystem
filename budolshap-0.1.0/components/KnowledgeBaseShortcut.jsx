'use client';

import { useEffect, useState } from 'react';

export default function KnowledgeBaseShortcut() {
    const [showModal, setShowModal] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [token, setToken] = useState(null);
    const [emailSent, setEmailSent] = useState(false);
    const [remainingAttempts, setRemainingAttempts] = useState(null);

    useEffect(() => {
        // Check if extend session was requested from knowledge base
        const extendRequested = localStorage.getItem('kb_extend_requested');
        if (extendRequested === 'true') {
            localStorage.removeItem('kb_extend_requested');
            // Auto-show modal for extend request
            setShowModal(true);
        }

        const handleKeyDown = (event) => {
            // Check for Ctrl+Shift+K (Windows/Linux) or Cmd+Shift+K (Mac)
            const isShortcut = (event.ctrlKey || event.metaKey) && 
                              event.shiftKey && 
                              event.key.toLowerCase() === 'k';
            
            // Prevent default browser behavior
            if (isShortcut) {
                event.preventDefault();
                event.stopPropagation();
                setShowModal(true);
                setPassword('');
                setError('');
                setEmailSent(false);
                setToken(null);
                setRemainingAttempts(null);
            }
        };

        // Add event listener
        window.addEventListener('keydown', handleKeyDown);

        // Cleanup
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleRequestPassword = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/knowledge-base/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'request' }),
            });

            const data = await response.json();

            if (response.ok) {
                setToken(data.token);
                setEmailSent(true);
                setError('');
            } else {
                setError(data.error || 'Failed to send password. Please try again.');
            }
        } catch (err) {
            setError('Failed to request password. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleValidatePassword = async () => {
        if (!password.trim()) {
            setError('Please enter the password');
            return;
        }

        if (!token) {
            setError('Please request a password first');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/knowledge-base/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'validate',
                    token,
                    password: password.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok && data.valid) {
                // Password is correct - store expiration timestamp in localStorage
                if (data.expiresAt) {
                    localStorage.setItem('kb_session_expires', data.expiresAt.toString());
                    localStorage.setItem('kb_session_start', Date.now().toString());
                }
                // Open knowledge base
                const knowledgeBasePath = '/documentation/knowledge-base.html';
                window.open(knowledgeBasePath, '_blank');
                setShowModal(false);
                setPassword('');
                setError('');
                setEmailSent(false);
                setToken(null);
            } else {
                // Password is incorrect
                if (data.remainingAttempts !== undefined) {
                    setRemainingAttempts(data.remainingAttempts);
                }
                if (response.status === 429 || response.status === 400) {
                    // Max attempts or expired
                    setError(data.error || 'Access Denied');
                    setTimeout(() => {
                        setShowModal(false);
                        setPassword('');
                        setError('');
                        setEmailSent(false);
                        setToken(null);
                        setRemainingAttempts(null);
                    }, 2000);
                } else {
                    setError(data.error || 'Access Denied');
                    setPassword(''); // Clear password for retry
                }
            }
        } catch (err) {
            setError('Failed to validate password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setPassword('');
        setError('');
        setEmailSent(false);
        setToken(null);
        setRemainingAttempts(null);
        setLoading(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && emailSent && password.trim()) {
            handleValidatePassword();
        } else if (e.key === 'Escape') {
            handleClose();
        }
    };

    if (!showModal) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]"
            onClick={handleClose}
        >
            <div 
                className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                        📚 Knowledge Base Access
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                        disabled={loading}
                    >
                        ×
                    </button>
                </div>

                {!emailSent ? (
                    <div>
                        <p className="text-gray-600 mb-4">
                            To access the knowledge base, a password will be sent to your email.
                            Click the button below to receive your access code.
                        </p>
                        <button
                            onClick={handleRequestPassword}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? 'Sending...' : '📧 Send Access Code to Email'}
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <p className="text-green-800 text-sm">
                                ✅ Password has been sent to <strong>reynaldomgalvez@gmail.com</strong>
                            </p>
                            <p className="text-green-600 text-xs mt-2">
                                Please check your email and enter the 6-digit code below. The code expires in 10 minutes.
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enter Access Code
                            </label>
                            <input
                                type="text"
                                value={password}
                                onChange={(e) => {
                                    // Only allow digits, max 6 characters
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setPassword(value);
                                    setError(''); // Clear error when typing
                                }}
                                onKeyDown={handleKeyPress}
                                placeholder="000000"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                maxLength={6}
                                autoFocus
                                disabled={loading}
                            />
                            {remainingAttempts !== null && remainingAttempts > 0 && (
                                <p className="text-sm text-gray-500 mt-2 text-center">
                                    {remainingAttempts} attempt(s) remaining
                                </p>
                            )}
                        </div>

                        {error && (
                            <div className={`mb-4 p-3 rounded-lg ${
                                error.includes('Access Denied') || error.includes('expired') || error.includes('exceeded')
                                    ? 'bg-red-50 border border-red-200'
                                    : 'bg-yellow-50 border border-yellow-200'
                            }`}>
                                <p className={`text-sm ${
                                    error.includes('Access Denied') || error.includes('expired') || error.includes('exceeded')
                                        ? 'text-red-800'
                                        : 'text-yellow-800'
                                }`}>
                                    {error}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleValidatePassword}
                                disabled={loading || !password.trim()}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? 'Validating...' : '🔓 Access Knowledge Base'}
                            </button>
                            <button
                                onClick={handleRequestPassword}
                                disabled={loading}
                                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                title="Resend code"
                            >
                                ↻
                            </button>
                        </div>
                    </div>
                )}

                <p className="text-xs text-gray-500 mt-4 text-center">
                    Press <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300">Ctrl+Shift+K</kbd> (Windows/Linux) or <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300">Cmd+Shift+K</kbd> (Mac) to open this dialog
                </p>
            </div>
        </div>
    );
}
