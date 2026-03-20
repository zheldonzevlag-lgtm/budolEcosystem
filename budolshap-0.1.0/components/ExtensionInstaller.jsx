'use client';

import { useEffect, useState } from 'react';
import { XIcon } from 'lucide-react';

const EXTENSION_ID = 'budolshap-kb-extension'; // We'll set this after installation
const EXTENSION_NAME = 'BudolShap Knowledge Base Shortcut';

export default function ExtensionInstaller() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/system/settings');
                const data = await res.json();
                console.log('[ExtensionInstaller] Settings fetched:', data);
                if (data) {
                    // Disable if either quickInstallerEnabled is false OR marketingAdsEnabled is false
                    const enabled =
                        data.quickInstallerEnabled === true &&
                        data.marketingAdsEnabled === true;
                    setIsEnabled(enabled);
                }
            } catch (error) {
                console.error('Failed to fetch extension settings:', error);
            }
        };
        fetchSettings();

        // Check if user has dismissed the prompt
        const dismissedStatus = localStorage.getItem('kb-extension-dismissed');
        const dontShowStatus = localStorage.getItem('kb-extension-dont-show');
        console.log('[ExtensionInstaller] Local dismissal state:', { dismissedStatus, dontShowStatus });
        if (dismissedStatus === 'true' || dontShowStatus === 'true') {
            setDismissed(true);
        }
    }, []);

    useEffect(() => {
        if (!isEnabled) return;
        // Check if extension is installed
        checkExtensionInstalled();

        // Check if user has dismissed the prompt
        const dismissedStatus = localStorage.getItem('kb-extension-dismissed');
        if (dismissedStatus === 'true') {
            setDismissed(true);
            return;
        }

        // Show prompt after a delay (so it doesn't interfere with page load)
        const timer = setTimeout(() => {
            if (!isInstalled && !dismissed) {
                setShowPrompt(true);
            }
        }, 3000); // Show after 3 seconds

        // Periodically check if extension gets installed
        const checkInterval = setInterval(() => {
            if (typeof window !== 'undefined' && window.kbExtensionInstalled) {
                setIsInstalled(true);
                setShowPrompt(false);
            }
        }, 2000); // Check every 2 seconds

        return () => {
            clearTimeout(timer);
            clearInterval(checkInterval);
        };
    }, [isInstalled, dismissed, isEnabled]);

    const checkExtensionInstalled = () => {
        // Try to detect extension by checking for a known message
        // Extension will inject a script that sets window.kbExtensionInstalled
        if (typeof window !== 'undefined' && window.kbExtensionInstalled) {
            setIsInstalled(true);
            setShowPrompt(false);
            return;
        }

        // Alternative: Check if extension responds to a message
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            // Try to send a message to extension (if installed)
            try {
                chrome.runtime.sendMessage(
                    EXTENSION_ID,
                    { action: 'ping' },
                    (response) => {
                        if (!chrome.runtime.lastError && response) {
                            setIsInstalled(true);
                            setShowPrompt(false);
                        }
                    }
                );
            } catch (e) {
                // Extension not installed or not accessible
            }
        }
    };

    const handleInstall = () => {
        // Open auto-installer page
        const installerUrl = typeof window !== 'undefined'
            ? `${window.location.origin}/documentation/browser-extension/auto-installer.html`
            : '/documentation/browser-extension/auto-installer.html';
        window.open(installerUrl, '_blank');
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        setDismissed(true);
        localStorage.setItem('kb-extension-dismissed', 'true');
    };

    const handleDontShowAgain = () => {
        setShowPrompt(false);
        setDismissed(true);
        localStorage.setItem('kb-extension-dismissed', 'true');
        localStorage.setItem('kb-extension-dont-show', 'true');
    };

    // Don't show if extension is installed, user dismissed, or feature is disabled
    if (isInstalled || dismissed || !showPrompt || !isEnabled) {
        if (showPrompt) {
            console.log('[ExtensionInstaller] Hidden:', { isInstalled, dismissed, showPrompt, isEnabled });
        }
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-[99999] max-w-md animate-slide-up">
            <div className="bg-white rounded-lg shadow-2xl border-2 border-purple-500 p-6 relative">
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                >
                    <XIcon size={20} />
                </button>

                <div className="flex items-start gap-4">
                    <div className="text-4xl">🚀</div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800 mb-2">
                            Quick Access Extension Available!
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Install our browser extension to access the Knowledge Base with{' '}
                            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                                Ctrl+Shift+K
                            </kbd>{' '}
                            from <strong>any website</strong>!
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={handleInstall}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-900 transition-all text-sm"
                            >
                                📦 Install Extension
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                            >
                                Later
                            </button>
                        </div>

                        <button
                            onClick={handleDontShowAgain}
                            className="mt-3 text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                            Don't show again
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}

