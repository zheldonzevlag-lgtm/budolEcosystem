'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Loading from '@/components/Loading'
import { AlertTriangle, CheckCircle, XCircle, Info, ExternalLink, Copy, Check, Rocket, Settings, Key, Play } from 'lucide-react'

export default function ErrorTrackingSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        enabled: false,
        sentryDsn: '',
        environment: 'production',
        tracesSampleRate: 0.1,
    })
    const [status, setStatus] = useState({
        enabled: false,
        configured: false,
        message: '',
        status: 'unknown'
    })
    const [setupStep, setSetupStep] = useState(1)
    const [showSetupWizard, setShowSetupWizard] = useState(false)
    const [copiedDsn, setCopiedDsn] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [syncEnvironment, setSyncEnvironment] = useState('development') // 'development' or 'production'

    useEffect(() => {
        fetchErrorTrackingSettings()
    }, [])

    const fetchErrorTrackingSettings = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const res = await fetch('/api/system/error-tracking', {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await res.json()
            
            setSettings({
                enabled: data.enabled || false,
                sentryDsn: data.config?.sentryDsn === '***configured***' ? '' : (data.config?.sentryDsn || ''),
                environment: data.config?.environment || 'production',
                tracesSampleRate: data.config?.tracesSampleRate || 0.1,
            })
            setStatus(data)
            
            // Show setup wizard if not configured
            if (!data.configured && !data.enabled) {
                setShowSetupWizard(true)
            }
            
            setLoading(false)
        } catch (err) {
            console.error(err)
            toast.error('Failed to load error tracking settings')
            setLoading(false)
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const payload = {
                enabled: settings.enabled,
                sentryDsn: settings.enabled ? settings.sentryDsn : null,
                environment: settings.environment,
                tracesSampleRate: parseFloat(settings.tracesSampleRate)
            }

            const res = await fetch('/api/system/error-tracking', {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (res.ok) {
                const message = data.message || "Error tracking settings saved!"
                toast.success(message, { duration: 6000 })
                
                // Refresh status after save
                setTimeout(async () => {
                    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                    const statusRes = await fetch('/api/system/error-tracking', {
                        credentials: 'include',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    })
                    const statusData = await statusRes.json()
                    setStatus(statusData)
                }, 1000)
            } else {
                toast.error(data.error || "Failed to save error tracking settings")
            }
        } catch (err) {
            toast.error(err.message || "Failed to save error tracking settings")
        } finally {
            setSaving(false)
        }
    }

    const testConnection = async () => {
        if (!settings.enabled) {
            toast.error('Please enable error tracking first')
            return
        }

        if (!settings.sentryDsn) {
            toast.error('Please enter a Sentry DSN first')
            return
        }

        try {
            // Test by sending a test error to Sentry
            if (typeof window !== 'undefined' && window.Sentry) {
                window.Sentry.captureMessage('Test error from BudolShap admin panel', 'info')
                toast.success('Test error sent to Sentry! Check your Sentry dashboard.', { duration: 5000 })
            } else {
                toast.info('Sentry is not initialized. Restart the application after saving settings.', { duration: 5000 })
            }
        } catch (err) {
            toast.error('Failed to test Sentry connection')
        }
    }

    const copyDsn = () => {
        if (settings.sentryDsn) {
            navigator.clipboard.writeText(settings.sentryDsn)
            setCopiedDsn(true)
            toast.success('DSN copied to clipboard!')
            setTimeout(() => setCopiedDsn(false), 2000)
        }
    }

    const openSentrySignup = () => {
        window.open('https://sentry.io/signup/', '_blank', 'noopener,noreferrer')
    }

    const openSentryProject = () => {
        window.open('https://sentry.io/organizations/', '_blank', 'noopener,noreferrer')
    }

    const openSentryDsn = () => {
        window.open('https://sentry.io/settings/projects/', '_blank', 'noopener,noreferrer')
    }

    const syncConfiguration = async () => {
        setSyncing(true)
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const res = await fetch('/api/system/error-tracking/sync', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    targetEnvironment: syncEnvironment // 'development' or 'production'
                })
            })

            const data = await res.json()

            if (res.ok) {
                if (syncEnvironment === 'production' || data.isVercel) {
                    // Production/Vercel environment - show instructions
                    const envName = syncEnvironment === 'production' ? 'Production (Vercel)' : 'Vercel'
                    toast.success(`Configuration validated for ${envName}!`, { duration: 3000 })
                    setTimeout(() => {
                        const instructions = data.instructions.join('\n')
                        const alertMessage = `⚠️ ${envName} Environment Configuration\n\n${instructions}\n\n📋 Next Steps:\n1. Copy the environment variables above\n2. Go to Vercel Dashboard → Your Project → Settings → Environment Variables\n3. Add or update each variable\n4. Select the appropriate environment (Production/Preview/Development)\n5. Save and redeploy your application`
                        alert(alertMessage)
                    }, 500)
                } else {
                    // Local development environment - success
                    toast.success(data.message || 'Configuration synced to .env.local successfully!', { duration: 5000 })
                }
            } else {
                toast.error(data.error || 'Failed to sync configuration')
            }
        } catch (err) {
            console.error('Sync error:', err)
            toast.error(err.message || 'Failed to sync configuration')
        } finally {
            setSyncing(false)
        }
    }

    if (loading) return <Loading />

    const needsSetup = !status.configured && !status.enabled

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Error Tracking</h1>
                {needsSetup && (
                    <button
                        onClick={() => setShowSetupWizard(!showSetupWizard)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Rocket size={16} />
                        {showSetupWizard ? 'Hide Setup Guide' : 'Show Setup Guide'}
                    </button>
                )}
            </div>

            {/* Setup Wizard */}
            {showSetupWizard && needsSetup && (
                <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="bg-blue-600 rounded-full p-3">
                            <Rocket className="text-white" size={24} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Quick Setup Wizard</h2>
                            <p className="text-sm text-slate-600 mb-4">
                                Follow these steps to set up Sentry error tracking for your application.
                            </p>
                            
                            <div className="space-y-3">
                                {/* Step 1 */}
                                <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                                    setupStep >= 1 ? 'bg-white border-2 border-blue-300' : 'bg-slate-50 border-2 border-slate-200'
                                }`}>
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                        setupStep > 1 ? 'bg-green-500 text-white' : setupStep === 1 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
                                    }`}>
                                        {setupStep > 1 ? <Check size={18} /> : '1'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-slate-800">Create Sentry Account</h3>
                                            <button
                                                onClick={openSentrySignup}
                                                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                                            >
                                                Open Sentry <ExternalLink size={12} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1">
                                            Sign up for a free Sentry account (5,000 events/month free)
                                        </p>
                                        {setupStep === 1 && (
                                            <div className="mt-2 text-xs text-blue-700">
                                                💡 Tip: You can use Google or GitHub to sign up quickly
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                                    setupStep >= 2 ? 'bg-white border-2 border-blue-300' : 'bg-slate-50 border-2 border-slate-200'
                                }`}>
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                        setupStep > 2 ? 'bg-green-500 text-white' : setupStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
                                    }`}>
                                        {setupStep > 2 ? <Check size={18} /> : '2'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-slate-800">Create Next.js Project</h3>
                                            <button
                                                onClick={openSentryProject}
                                                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                                            >
                                                Create Project <ExternalLink size={12} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1">
                                            In Sentry, create a new project and select "Next.js" as the platform
                                        </p>
                                        {setupStep === 2 && (
                                            <div className="mt-2 text-xs text-blue-700">
                                                💡 Tip: Name it "budolShap Production" or similar
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                                    setupStep >= 3 ? 'bg-white border-2 border-blue-300' : 'bg-slate-50 border-2 border-slate-200'
                                }`}>
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                        setupStep > 3 ? 'bg-green-500 text-white' : setupStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
                                    }`}>
                                        {setupStep > 3 ? <Check size={18} /> : '3'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-slate-800">Copy Your DSN</h3>
                                            <button
                                                onClick={openSentryDsn}
                                                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                                            >
                                                Get DSN <ExternalLink size={12} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1">
                                            Copy the DSN (Data Source Name) from your project settings
                                        </p>
                                        {setupStep === 3 && (
                                            <div className="mt-2 text-xs text-blue-700">
                                                💡 Tip: DSN looks like: https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Step 4 */}
                                <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                                    setupStep >= 4 ? 'bg-white border-2 border-blue-300' : 'bg-slate-50 border-2 border-slate-200'
                                }`}>
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                        setupStep > 4 ? 'bg-green-500 text-white' : setupStep === 4 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
                                    }`}>
                                        {setupStep > 4 ? <Check size={18} /> : '4'}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-800">Configure Below</h3>
                                        <p className="text-xs text-slate-600 mt-1">
                                            Paste your DSN in the form below, enable error tracking, and save
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                <button
                                    onClick={() => setSetupStep(Math.max(1, setupStep - 1))}
                                    disabled={setupStep === 1}
                                    className="px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setSetupStep(Math.min(4, setupStep + 1))}
                                    disabled={setupStep === 4}
                                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                                <div className="flex-1"></div>
                                <button
                                    onClick={() => setShowSetupWizard(false)}
                                    className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                                >
                                    I'll do this later
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Card */}
            <div className={`mb-6 p-4 rounded-lg border ${
                status.status === 'active' 
                    ? 'bg-green-50 border-green-200' 
                    : status.enabled && !status.configured
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200'
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {status.status === 'active' ? (
                            <CheckCircle className="text-green-600" size={24} />
                        ) : status.enabled && !status.configured ? (
                            <AlertTriangle className="text-yellow-600" size={24} />
                        ) : (
                            <XCircle className="text-gray-400" size={24} />
                        )}
                        <div>
                            <p className="font-medium text-slate-800">
                                Status: <span className={
                                    status.status === 'active' 
                                        ? 'text-green-600' 
                                        : status.enabled && !status.configured
                                        ? 'text-yellow-600'
                                        : 'text-gray-500'
                                }>
                                    {status.status === 'active' ? 'Active' : status.enabled ? 'Not Configured' : 'Disabled'}
                                </span>
                            </p>
                            <p className="text-sm text-slate-600 mt-1">{status.message}</p>
                        </div>
                    </div>
                    {status.status === 'active' && (
                        <button
                            onClick={testConnection}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium text-slate-700 transition-colors flex items-center gap-2"
                        >
                            <Play size={16} />
                            Test Connection
                        </button>
                    )}
                </div>
            </div>

            <form onSubmit={(e) => {
                handleSave(e)
                if (setupStep === 4 && settings.sentryDsn) {
                    setShowSetupWizard(false)
                }
            }} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div>
                    <label className="flex items-center gap-3 mb-4">
                        <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={e => setSettings({ ...settings, enabled: e.target.checked })}
                            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-slate-700">
                            Enable Error Tracking (Sentry)
                        </span>
                    </label>
                    <p className="text-xs text-slate-500 ml-8">
                        When enabled, errors and exceptions will be automatically tracked and sent to Sentry for monitoring and debugging.
                    </p>
                </div>

                {settings.enabled && (
                    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                        {!showSetupWizard && (
                            <div className="bg-blue-50 p-4 rounded border border-blue-200">
                                <div className="flex items-start gap-2">
                                    <Info className="text-blue-600 mt-0.5" size={18} />
                                    <div className="flex-1">
                                        <div className="text-sm text-blue-800">
                                            <p className="font-medium mb-2">Quick Setup Guide:</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={openSentrySignup}
                                                    className="text-left px-3 py-2 bg-white rounded border border-blue-200 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-2 text-xs"
                                                >
                                                    <Rocket size={14} />
                                                    <span>1. Sign up for Sentry</span>
                                                    <ExternalLink size={12} className="ml-auto" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={openSentryProject}
                                                    className="text-left px-3 py-2 bg-white rounded border border-blue-200 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-2 text-xs"
                                                >
                                                    <Settings size={14} />
                                                    <span>2. Create Next.js Project</span>
                                                    <ExternalLink size={12} className="ml-auto" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={openSentryDsn}
                                                    className="text-left px-3 py-2 bg-white rounded border border-blue-200 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-2 text-xs"
                                                >
                                                    <Key size={14} />
                                                    <span>3. Get Your DSN</span>
                                                    <ExternalLink size={12} className="ml-auto" />
                                                </button>
                                                <div className="text-left px-3 py-2 bg-white rounded border border-blue-200 text-xs flex items-center gap-2">
                                                    <CheckCircle size={14} className="text-green-600" />
                                                    <span>4. Paste DSN & Save</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-slate-600">
                                    Sentry DSN <span className="text-red-500">*</span>
                                </label>
                                {settings.sentryDsn && (
                                    <button
                                        type="button"
                                        onClick={copyDsn}
                                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                                    >
                                        {copiedDsn ? (
                                            <>
                                                <Check size={12} /> Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={12} /> Copy DSN
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={settings.sentryDsn}
                                    onChange={e => {
                                        setSettings({ ...settings, sentryDsn: e.target.value })
                                        if (setupStep === 3) setSetupStep(4)
                                    }}
                                    placeholder="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
                                    className="w-full border border-slate-300 rounded-md p-2.5 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    required={settings.enabled}
                                />
                                <button
                                    type="button"
                                    onClick={openSentryDsn}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                                    title="Open Sentry to get DSN"
                                >
                                    <ExternalLink size={14} />
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">
                                Your Sentry Data Source Name (DSN). Found in your Sentry project settings.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-600">
                                Environment
                            </label>
                            <select
                                value={settings.environment}
                                onChange={e => setSettings({ ...settings, environment: e.target.value })}
                                className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="development">Development</option>
                                <option value="staging">Staging</option>
                                <option value="production">Production</option>
                            </select>
                            <p className="text-[10px] text-slate-400 mt-1">
                                Environment name to tag errors in Sentry (e.g., development, staging, production).
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-600">
                                Traces Sample Rate
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                value={settings.tracesSampleRate}
                                onChange={e => setSettings({ ...settings, tracesSampleRate: parseFloat(e.target.value) || 0 })}
                                className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                                Percentage of transactions to trace (0.0 to 1.0). Lower values reduce Sentry usage. Recommended: 0.1 (10%).
                            </p>
                        </div>
                    </div>
                )}

                <div className="pt-4 border-t">
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="bg-slate-900 text-white px-6 py-2.5 rounded-md hover:bg-slate-800 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[44px] whitespace-nowrap sm:mb-[18px]"
                        >
                            {saving ? 'Saving...' : 'Save Error Tracking Settings'}
                        </button>
                        {settings.enabled && (
                            <>
                                <div className="flex-1 sm:max-w-[220px] w-full">
                                    <label className="block text-xs font-medium text-slate-600 mb-1 leading-[14px]">
                                        Sync Target Environment:
                                    </label>
                                    <select
                                        value={syncEnvironment}
                                        onChange={e => setSyncEnvironment(e.target.value)}
                                        disabled={syncing || saving}
                                        className="w-full border border-slate-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed bg-white h-[44px] leading-tight"
                                    >
                                        <option value="development">🖥️ Development (Local)</option>
                                        <option value="production">☁️ Production (Vercel)</option>
                                    </select>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {syncEnvironment === 'development' 
                                            ? 'Updates .env.local file automatically'
                                            : 'Shows instructions for Vercel Dashboard'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={syncConfiguration}
                                    disabled={syncing || saving}
                                    className="bg-blue-600 text-white px-6 py-2.5 rounded-md hover:bg-blue-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-[44px] w-full sm:w-auto sm:mb-[18px]"
                                >
                                    {syncing ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Syncing...
                                        </>
                                    ) : (
                                        <>
                                            <Settings size={16} />
                                            Sync Configuration
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                    <div className="text-xs text-slate-400 mt-3 space-y-1">
                        {settings.enabled ? (
                            <>
                                <p className="font-medium text-slate-600">⚠️ Next Steps:</p>
                                <div className="space-y-2">
                                    {syncEnvironment === 'development' ? (
                                        <>
                                            <ol className="list-decimal list-inside ml-2 space-y-0.5">
                                                <li>Select <strong>"Development (Local)"</strong> and click <strong>"Sync Configuration"</strong></li>
                                                <li>This will update your <code className="bg-slate-100 px-1 py-0.5 rounded">.env.local</code> file</li>
                                                <li>Restart your local development server</li>
                                            </ol>
                                            <p className="mt-1 text-slate-500">
                                                💡 For local development, the sync button automatically updates your environment variables.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <ol className="list-decimal list-inside ml-2 space-y-0.5">
                                                <li>Select <strong>"Production (Vercel)"</strong> and click <strong>"Sync Configuration"</strong></li>
                                                <li>Copy the environment variables from the alert dialog</li>
                                                <li>Set them in Vercel Dashboard → Settings → Environment Variables</li>
                                                <li>Redeploy your application</li>
                                            </ol>
                                            <p className="mt-1 text-slate-500">
                                                💡 For Vercel production, you need to manually set environment variables in the Vercel dashboard.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p>Error tracking will be disabled after saving.</p>
                        )}
                    </div>
                </div>
            </form>
        </div>
    )
}

