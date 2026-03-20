'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { XIcon, CreditCard, Truck, Headset as HeadsetIcon, Banknote } from 'lucide-react'
import BudolPayText from './payment/BudolPayText';

export default function MarketingAdPopup() {
    const [settings, setSettings] = useState(null)
    const [currentAd, setCurrentAd] = useState(null)
    const [isVisible, setIsVisible] = useState(false)
    const positionClass = (pos) => {
        switch (pos) {
            case 'top_right': return 'fixed top-4 right-4';
            case 'top_center': return 'fixed top-4 left-1/2 -translate-x-1/2';
            case 'top_left': return 'fixed top-4 left-4';
            case 'bottom_right': return 'fixed bottom-4 right-4';
            case 'bottom_center': return 'fixed bottom-4 left-1/2 -translate-x-1/2';
            case 'bottom_left': return 'fixed bottom-4 left-4';
            case 'center': return 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
            default: return 'fixed bottom-4 right-4';
        }
    }

    useEffect(() => {
        // Clear previous session data on refresh/reload as requested
        sessionStorage.removeItem('last_ad_index')
        sessionStorage.removeItem('dismissed_ads')
    }, [])

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/system/settings')
            const data = await res.json()

            if (data && data.marketingAdsEnabled && ((data.marketingAdConfigs && data.marketingAdConfigs.length > 0) || (data.selectedMarketingAds && data.selectedMarketingAds.length > 0))) {
                setSettings(data)

                // Determine which ad to show
                let adToShow = null
                // Flatten groups to individual items with group metadata
                const groups = (data.marketingAdConfigs && data.marketingAdConfigs.length > 0) ? data.marketingAdConfigs : []
                const activeGroup = groups.find(g => g.active)
                const sourceGroups = activeGroup ? [activeGroup] : groups
                const ads = (sourceGroups && sourceGroups.length > 0)
                    ? sourceGroups.flatMap(g => (g.items || []).map(it => ({
                        imageUrl: it.imageUrl,
                        title: g.title,
                        subtitle: g.subtitle,
                        position: g.position || 'bottom_right',
                        brandBar: g.brandBar || []
                    })))
                    : data.selectedMarketingAds

                if (data.adDisplayMode === 'RANDOM') {
                    adToShow = ads[Math.floor(Math.random() * ads.length)]
                } else {
                    const lastIndex = parseInt(sessionStorage.getItem('last_ad_index') || '-1')
                    const nextIndex = (lastIndex + 1) % ads.length
                    adToShow = ads[nextIndex]
                    sessionStorage.setItem('last_ad_index', nextIndex.toString())
                }

                // Check if this specific ad was dismissed in this session
                const dismissedAds = JSON.parse(sessionStorage.getItem('dismissed_ads') || '[]')
                const dismissKey = typeof adToShow === 'string' ? adToShow : (adToShow.imageUrl || '')
                if (!dismissedAds.includes(dismissKey)) {
                    setCurrentAd(adToShow)

                    // Show after a delay like the extension installer
                    setTimeout(() => {
                        // Play sound just before showing
                        try {
                            const audio = new Audio('/assets/boxing_bell_effect.mp3')
                            audio.play().catch(e => console.log('Audio play failed:', e))
                        } catch (err) {
                            console.error('Sound error:', err)
                        }

                        // Small extra delay so sound starts before visually appearing
                        setTimeout(() => {
                            setIsVisible(true)
                        }, 500)
                    }, 3500)
                }
            }
        } catch (error) {
            console.error('Failed to fetch marketing settings:', error)
        }
    }, [])

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    const handleDismiss = () => {
        setIsVisible(false)
        if (currentAd) {
            const dismissedAds = JSON.parse(sessionStorage.getItem('dismissed_ads') || '[]')
            if (!dismissedAds.includes(currentAd)) {
                dismissedAds.push(currentAd)
                sessionStorage.setItem('dismissed_ads', JSON.stringify(dismissedAds))
            }
        }
    }

    if (!isVisible || !currentAd) return null

    // Specialized wacky content for the danica-ad
    const isWackyAd = (typeof currentAd === 'string' ? currentAd : currentAd?.imageUrl?.split('/').pop()) === 'danica-ad.png'
    const brandBar = typeof currentAd === 'object' ? (currentAd.brandBar || []) : []
    const IconMap = {
        credit_card: CreditCard,
        truck: Truck,
        headset: HeadsetIcon,
        loan: Banknote
    }
    const renderTitle = (text) => {
        if (!text) return null
        const tokens = text.split(/(\s+)/)
        return tokens.map((tok, i) => {
            if (/^shap([!,.?]*)$/i.test(tok)) {
                return <span key={i} className="text-emerald-500 font-bold">{tok}</span>
            }
            if (/budol[_a-zA-Z₱]+/i.test(tok)) {
                return <BudolPayText key={i} text={tok} />
            }
            return <React.Fragment key={i}>{tok}</React.Fragment>
        })
    }

    return (
        <div className={`${positionClass(typeof currentAd === 'string' ? 'bottom_right' : (currentAd.position || 'bottom_right'))} z-[99999] px-4 sm:px-0 max-w-[90vw] animate-slide-up-right w-auto`}>
            <div className={`bg-transparent rounded-2xl overflow-visible relative group`}>
                <div className="flex flex-col">
                    <div className={`relative w-full bg-transparent flex items-center justify-center`}>
                        <img
                            src={typeof currentAd === 'string' ? `/marketing-ads/${currentAd}` : (currentAd.imageUrl || '')}
                            alt="Special Offer"
                            className={`max-h-[60vh] sm:max-h-[50vh] w-auto h-auto object-contain transition-transform duration-500 ${isWackyAd ? 'pt-4 px-4' : ''}`}
                        />
                    </div>

                    <div className={`relative px-4 sm:px-5 pb-4 sm:pb-5 ${isWackyAd ? 'pt-1 sm:pt-2 pb-6 bg-white/90' : 'pt-4 sm:pt-5 bg-white/90'} backdrop-blur-sm rounded-b-2xl`}>
                        <button
                            onClick={handleDismiss}
                            aria-label="Close"
                            className="absolute -top-3 right-2 inline-flex items-center justify-center text-slate-600 hover:text-slate-800 text-xs rounded-full border border-slate-300 p-1.5 bg-white transition-transform duration-200 ease-out hover:scale-110 hover:rotate-90 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                        >
                            <XIcon size={14} />
                        </button>
                        {isWackyAd ? (
                            <div className="text-center">
                                <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">
                                    Tara shop na sa <BudolPayText text="budolShap" />.
                                </h3>
                                <p className="text-xs sm:text-sm text-blue-600 mb-4 font-bold">
                                    Sophisticated deals!, Wacky Prices ! <BudolPayText text="budol" /> na!
                                </p>

                                {/* All-in-one line for services */}
                                <div className="flex items-center justify-center gap-1.5 sm:gap-3 mb-4 py-2 border-t border-slate-100 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5 ml-10">
                                        <CreditCard size={18} className="text-slate-700" />
                                        <span className="text-xs sm:text-sm font-extrabold leading-none">
                                            <BudolPayText text="budolPay" />
                                        </span>
                                    </div>
                                    <div className="w-px h-4 bg-slate-300 shrink-0"></div>
                                    <div className="flex items-center gap-1.5">
                                        <Truck size={18} className="text-slate-700" />
                                        <span className="text-xs sm:text-sm font-extrabold leading-none">
                                            <BudolPayText text="budolExpress" />
                                        </span>
                                    </div>
                                    <div className="w-px h-4 bg-slate-300 shrink-0"></div>
                                    <div className="flex items-center gap-1.5 mr-10">
                                        <HeadsetIcon size={18} className="text-slate-700" />
                                        <span className="text-xs sm:text-sm font-extrabold leading-none">
                                            <BudolPayText text="budolCare" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                {typeof currentAd === 'object' && (currentAd.title || currentAd.subtitle) ? (
                                    <>
                                        {currentAd.title && (
                                            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
                                                {renderTitle(currentAd.title)}
                                            </h3>
                                        )}
                                        {currentAd.subtitle && (
                                            <p className="text-xs sm:text-sm text-slate-600 mb-3">
                                                {currentAd.subtitle}
                                            </p>
                                        )}
                                        {Array.isArray(brandBar) && brandBar.length > 0 && (
                                            <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-3 mb-4 py-2 border-t border-slate-100">
                                                {brandBar.map((b, i) => {
                                                    const labelText = b.label || 'budolPay'
                                                    const lower = labelText.toLowerCase()
                                                    let iconKey = b.icon
                                                    if (!iconKey) {
                                                        if (lower.includes('care')) iconKey = 'headset'
                                                        else if (lower.includes('xpress')) iconKey = 'truck'
                                                        else if (lower.includes('loan')) iconKey = 'loan'
                                                        else iconKey = 'credit_card'
                                                    }
                                                    const Ico = IconMap[iconKey] || CreditCard
                                                    const color = b.color ||
                                                        (lower.includes('xpress') ? '#f97316' :
                                                         lower.includes('loan') ? '#3b82f6' : undefined)
                                                    const useBudolText = labelText.toLowerCase().includes('budol')
                                                    return (
                                                        <React.Fragment key={i}>
                                                            {lower.includes('care') && <span className="basis-full sm:basis-0" />}
                                                            <div className="flex items-center gap-1.5">
                                                                <Ico size={18} className="text-slate-700" />
                                                            {useBudolText ? (() => {
                                                                const m = /budol(_?)([a-zA-Z₱]+)/i.exec(labelText) || []
                                                                const suffixRaw = m[2] || ''
                                                                const lowerSuffix = suffixRaw.toLowerCase()
                                                                let displaySuffix = suffixRaw
                                                                if (lowerSuffix === 'pay' || lowerSuffix === '₱ay') displaySuffix = 'Pay'
                                                                else if (lowerSuffix === 'shap') displaySuffix = 'Shap'
                                                                else if (lowerSuffix === 'care') displaySuffix = 'Care'
                                                                else if (lowerSuffix === 'express') displaySuffix = 'Xpress'
                                                                else if (lowerSuffix === 'loan') displaySuffix = 'Loan'
                                                                let effectiveColor = color
                                                                if (!effectiveColor) {
                                                                    if (lowerSuffix === 'xpress') effectiveColor = '#f97316'
                                                                    else if (lowerSuffix === 'loan') effectiveColor = '#3b82f6'
                                                                    else if (lowerSuffix === 'shap') effectiveColor = '#16a34a'
                                                                }
                                                                return (
                                                                    <span className="text-xs sm:text-sm font-extrabold leading-none">
                                                                        <span className="text-slate-600">budol</span>
                                                                        <span style={{ color: effectiveColor }}>{displaySuffix}</span>
                                                                    </span>
                                                                )
                                                            })() : (
                                                                <span className="text-xs sm:text-sm font-extrabold leading-none" style={{ color }}>
                                                                    {labelText}
                                                                </span>
                                                            )}
                                                            </div>
                                                        </React.Fragment>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
                                            Don't miss out!
                                        </h3>
                                        <p className="text-xs sm:text-sm text-slate-600 mb-3">
                                            Check out our latest arrivals on <BudolPayText text="budolShap" />.
                                        </p>
                                    </>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => {
                                window.location.href = '/shop'
                                handleDismiss()
                            }}
                            className="w-full py-2.5 sm:py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-100 transition-all active:scale-95 text-sm sm:text-base"
                        >
                            Start budol Now
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-up-right {
                    from {
                        transform: translate(100px, 100px);
                        opacity: 0;
                    }
                    to {
                        transform: translate(0, 0);
                        opacity: 1;
                    }
                }
                .animate-slide-up-right {
                    animation: slide-up-right 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            `}</style>
        </div>
    )
}
