'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Loading from '@/components/Loading'
import { Mail, MessageSquare, Save, Server, Globe } from 'lucide-react'

export default function NotificationSettings() {
    const [loading, setLoading] = useState(true)
    const [savingProvider, setSavingProvider] = useState(null)
    const [settings, setSettings] = useState({
        emailProvider: 'GOOGLE',
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        smtpFrom: '',
        brevoApiKey: '',
        gmassApiKey: '',
        smsProvider: 'CONSOLE',
        zerixApiKey: '',
        itextmoApiKey: '',
        itextmoClientCode: '',
        viberApiKey: '',
        brevoSmsApiKey: ''
    })

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        fetch('/api/system/settings', {
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setSettings({
                    emailProvider: data.emailProvider || 'GOOGLE',
                    smtpHost: data.smtpHost || '',
                    smtpPort: data.smtpPort || 587,
                    smtpUser: data.smtpUser || '',
                    smtpPass: data.smtpPass || '',
                    smtpFrom: data.smtpFrom || '',
                    brevoApiKey: data.brevoApiKey || '',
                    gmassApiKey: data.gmassApiKey || '',
                    smsProvider: data.smsProvider || 'CONSOLE',
                    zerixApiKey: data.zerixApiKey || '',
                    itextmoApiKey: data.itextmoApiKey || '',
                    itextmoClientCode: data.itextmoClientCode || '',
                    viberApiKey: data.viberApiKey || '',
                    brevoSmsApiKey: data.brevoSmsApiKey || ''
                })
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                toast.error("Failed to load settings")
                setLoading(false)
            })
    }, [])

    const handleSave = async (providerId) => {
        setSavingProvider(providerId)
        try {
            // Only send fields relevant to the provider being saved
            const payload = {
                emailProvider: settings.emailProvider,
                smsProvider: settings.smsProvider
            }

            if (providerId === 'google') {
                payload.smtpHost = settings.smtpHost
                payload.smtpPort = settings.smtpPort
                payload.smtpUser = settings.smtpUser
                payload.smtpPass = settings.smtpPass
                payload.smtpFrom = settings.smtpFrom
            } else if (providerId === 'brevo') {
                payload.brevoApiKey = settings.brevoApiKey
                payload.smtpFrom = settings.smtpFrom
            } else if (providerId === 'gmass') {
                payload.gmassApiKey = settings.gmassApiKey
                payload.smtpFrom = settings.smtpFrom
            } else if (providerId === 'zerix') {
                payload.zerixApiKey = settings.zerixApiKey
            } else if (providerId === 'itextmo') {
                payload.itextmoApiKey = settings.itextmoApiKey
                payload.itextmoClientCode = settings.itextmoClientCode
            } else if (providerId === 'viber') {
                payload.viberApiKey = settings.viberApiKey
            } else if (providerId === 'brevosms') {
                payload.brevoSmsApiKey = settings.brevoSmsApiKey
            }

            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const res = await fetch('/api/system/settings', {
                method: 'PUT',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast.success(`${providerId.charAt(0).toUpperCase() + providerId.slice(1)} settings saved!`)
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to save settings")
            }
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSavingProvider(null)
        }
    }

    if (loading) return <Loading />

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Notification Settings</h1>
                <p className="text-slate-500">Configure and manage your delivery providers individually</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                {/* EMAIL PROVIDERS SECTION */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 px-2">
                        <Mail className="text-blue-600" size={20} />
                        <h2 className="font-bold text-slate-700 uppercase tracking-wider text-sm">Email Providers</h2>
                    </div>

                    {/* Google Mail Card */}
                    <div className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all ${settings.emailProvider === 'GOOGLE' ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-100'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${settings.emailProvider === 'GOOGLE' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    <Server size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Google Mail / SMTP</h3>
                                    <p className="text-xs text-slate-500">Standard SMTP integration</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, emailProvider: 'GOOGLE' })}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${settings.emailProvider === 'GOOGLE' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {settings.emailProvider === 'GOOGLE' ? 'ACTIVE' : 'USE THIS'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">SMTP Host</label>
                                    <input
                                        type="text"
                                        value={settings.smtpHost}
                                        onChange={e => setSettings({ ...settings, smtpHost: e.target.value })}
                                        placeholder="smtp.gmail.com"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">SMTP Port</label>
                                    <input
                                        type="number"
                                        value={settings.smtpPort}
                                        onChange={e => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Sender Email</label>
                                <input
                                    type="email"
                                    value={settings.smtpFrom}
                                    onChange={e => setSettings({ ...settings, smtpFrom: e.target.value })}
                                    placeholder="noreply@example.com"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Username</label>
                                <input
                                    type="text"
                                    value={settings.smtpUser}
                                    onChange={e => setSettings({ ...settings, smtpUser: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Password</label>
                                <input
                                    type="password"
                                    value={settings.smtpPass}
                                    onChange={e => setSettings({ ...settings, smtpPass: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={() => handleSave('google')}
                                disabled={savingProvider === 'google'}
                                className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white p-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                            >
                                <Save size={16} />
                                {savingProvider === 'google' ? 'Saving...' : 'Save Google Settings'}
                            </button>
                        </div>
                    </div>

                    {/* Brevo Card */}
                    <div className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all ${settings.emailProvider === 'BREVO' ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-100'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${settings.emailProvider === 'BREVO' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Brevo</h3>
                                    <p className="text-xs text-slate-500">Transactional Email Service</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, emailProvider: 'BREVO' })}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${settings.emailProvider === 'BREVO' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {settings.emailProvider === 'BREVO' ? 'ACTIVE' : 'USE THIS'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Brevo API Key</label>
                                <input
                                    type="password"
                                    value={settings.brevoApiKey}
                                    onChange={e => setSettings({ ...settings, brevoApiKey: e.target.value })}
                                    placeholder="xkeysib-..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Sender Email</label>
                                <input
                                    type="email"
                                    value={settings.smtpFrom}
                                    onChange={e => setSettings({ ...settings, smtpFrom: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={() => handleSave('brevo')}
                                disabled={savingProvider === 'brevo'}
                                className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white p-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                            >
                                <Save size={16} />
                                {savingProvider === 'brevo' ? 'Saving...' : 'Save Brevo Settings'}
                            </button>
                        </div>
                    </div>
                    {/* GMass Card */}
                    <div className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all ${settings.emailProvider === 'GMASS' ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-100'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${settings.emailProvider === 'GMASS' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">GMass</h3>
                                    <p className="text-xs text-slate-500">Mass Email for Gmail</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, emailProvider: 'GMASS' })}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${settings.emailProvider === 'GMASS' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {settings.emailProvider === 'GMASS' ? 'ACTIVE' : 'USE THIS'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">GMass API Key</label>
                                <input
                                    type="password"
                                    value={settings.gmassApiKey}
                                    onChange={e => setSettings({ ...settings, gmassApiKey: e.target.value })}
                                    placeholder="gmass-..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Sender Email</label>
                                <input
                                    type="email"
                                    value={settings.smtpFrom}
                                    onChange={e => setSettings({ ...settings, smtpFrom: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={() => handleSave('gmass')}
                                disabled={savingProvider === 'gmass'}
                                className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white p-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                            >
                                <Save size={16} />
                                {savingProvider === 'gmass' ? 'Saving...' : 'Save GMass Settings'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* SMS PROVIDERS SECTION */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 px-2">
                        <MessageSquare className="text-green-600" size={20} />
                        <h2 className="font-bold text-slate-700 uppercase tracking-wider text-sm">SMS Providers</h2>
                    </div>

                    {/* Viber Card */}
                    <div className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all ${settings.smsProvider === 'VIBER' ? 'border-green-500 ring-4 ring-green-50' : 'border-slate-100'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${settings.smsProvider === 'VIBER' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Viber</h3>
                                    <p className="text-xs text-slate-500">Viber Business Messaging</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, smsProvider: 'VIBER' })}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${settings.smsProvider === 'VIBER' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {settings.smsProvider === 'VIBER' ? 'ACTIVE' : 'USE THIS'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Viber API Key</label>
                                <input
                                    type="password"
                                    value={settings.viberApiKey}
                                    onChange={e => setSettings({ ...settings, viberApiKey: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={() => handleSave('viber')}
                                disabled={savingProvider === 'viber'}
                                className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white p-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                            >
                                <Save size={16} />
                                {savingProvider === 'viber' ? 'Saving...' : 'Save Viber Settings'}
                            </button>
                        </div>
                    </div>

                    {/* iTextMo Card */}
                    <div className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all ${settings.smsProvider === 'ITEXTMO' ? 'border-green-500 ring-4 ring-green-50' : 'border-slate-100'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${settings.smsProvider === 'ITEXTMO' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">iTextMo</h3>
                                    <p className="text-xs text-slate-500">Local PH SMS Provider</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, smsProvider: 'ITEXTMO' })}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${settings.smsProvider === 'ITEXTMO' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {settings.smsProvider === 'ITEXTMO' ? 'ACTIVE' : 'USE THIS'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">iTextMo API Key</label>
                                <input
                                    type="password"
                                    value={settings.itextmoApiKey}
                                    onChange={e => setSettings({ ...settings, itextmoApiKey: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Client Code</label>
                                <input
                                    type="text"
                                    value={settings.itextmoClientCode}
                                    onChange={e => setSettings({ ...settings, itextmoClientCode: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={() => handleSave('itextmo')}
                                disabled={savingProvider === 'itextmo'}
                                className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white p-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                            >
                                <Save size={16} />
                                {savingProvider === 'itextmo' ? 'Saving...' : 'Save iTextMo Settings'}
                            </button>
                        </div>
                    </div>

                    {/* Brevo SMS Card */}
                    <div className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all ${settings.smsProvider === 'BREVO' ? 'border-green-500 ring-4 ring-green-50' : 'border-slate-100'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${settings.smsProvider === 'BREVO' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Brevo SMS</h3>
                                    <p className="text-xs text-slate-500">Transactional SMS Service</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, smsProvider: 'BREVO' })}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${settings.smsProvider === 'BREVO' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {settings.smsProvider === 'BREVO' ? 'ACTIVE' : 'USE THIS'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Brevo SMS API Key</label>
                                <input
                                    type="password"
                                    value={settings.brevoSmsApiKey}
                                    onChange={e => setSettings({ ...settings, brevoSmsApiKey: e.target.value })}
                                    placeholder="xkeysib-..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={() => handleSave('brevosms')}
                                disabled={savingProvider === 'brevosms'}
                                className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white p-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                            >
                                <Save size={16} />
                                {savingProvider === 'brevosms' ? 'Saving...' : 'Save Brevo SMS Settings'}
                            </button>
                        </div>
                    </div>

                    {/* Zerix Card */}
                    <div className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all ${settings.smsProvider === 'ZERIX' ? 'border-green-500 ring-4 ring-green-50' : 'border-slate-100'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${settings.smsProvider === 'ZERIX' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Zerix</h3>
                                    <p className="text-xs text-slate-500">Local PH SMS Provider</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, smsProvider: 'ZERIX' })}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${settings.smsProvider === 'ZERIX' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {settings.smsProvider === 'ZERIX' ? 'ACTIVE' : 'USE THIS'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Zerix API Key</label>
                                <input
                                    type="password"
                                    value={settings.zerixApiKey}
                                    onChange={e => setSettings({ ...settings, zerixApiKey: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={() => handleSave('zerix')}
                                disabled={savingProvider === 'zerix'}
                                className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white p-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                            >
                                <Save size={16} />
                                {savingProvider === 'zerix' ? 'Saving...' : 'Save Zerix Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
