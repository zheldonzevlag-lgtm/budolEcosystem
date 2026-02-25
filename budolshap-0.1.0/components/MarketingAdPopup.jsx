'use client'

import { useState, useEffect, useCallback } from 'react'
import { XIcon, CreditCard, Truck, Headset as HeadsetIcon } from 'lucide-react'
import BudolPayText from './payment/BudolPayText';

export default function MarketingAdPopup() {
    const [settings, setSettings] = useState(null)
    const [currentAd, setCurrentAd] = useState(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Clear previous session data on refresh/reload as requested
        sessionStorage.removeItem('last_ad_index')
        sessionStorage.removeItem('dismissed_ads')
    }, [])

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/system/settings')
            const data = await res.json()

            if (data && data.marketingAdsEnabled && data.selectedMarketingAds && data.selectedMarketingAds.length > 0) {
                setSettings(data)

                // Determine which ad to show
                let adToShow = null
                const ads = data.selectedMarketingAds

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
                if (!dismissedAds.includes(adToShow)) {
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
    const isWackyAd = currentAd === 'danica-ad.png'

    return (
        <div className={`fixed bottom-4 right-4 z-[99999] px-4 sm:px-0 ${isWackyAd ? 'max-w-[360px] sm:max-w-lg' : 'max-w-[320px] sm:max-w-sm'} animate-slide-up-right w-full`}>
            <div className={`${isWackyAd ? 'bg-transparent' : 'bg-white'} rounded-2xl overflow-hidden relative group`}>
                <div className="flex flex-col">
                    <div className={`relative w-full ${isWackyAd ? 'aspect-[5/4] bg-transparent' : 'aspect-square bg-slate-50'} overflow-hidden`}>
                        <img
                            src={`/marketing-ads/${currentAd}`}
                            alt="Special Offer"
                            className={`w-full h-full object-contain hover:scale-110 transition-transform duration-500 ${isWackyAd ? 'pt-4 px-4' : ''}`}
                        />
                        <button
                            suppressHydrationWarning
                            onClick={handleDismiss}
                            className={`absolute ${isWackyAd ? 'bottom-2 right-2' : 'top-2 right-2'} p-1.5 bg-black/10 hover:bg-black/20 text-slate-600 rounded-full backdrop-blur-sm transition-all z-10`}
                        >
                            <XIcon size={18} />
                        </button>
                    </div>

                    <div className={`px-4 sm:px-5 pb-4 sm:pb-5 ${isWackyAd ? 'pt-1 sm:pt-2 pb-6 bg-white' : 'pt-4 sm:pt-5 bg-white'}`}>
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
                                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
                                    Don't miss out!
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 mb-3">
                                    Check out our latest arrivals on <BudolPayText text="budolShap" />.
                                </p>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                window.location.href = '/shop'
                                handleDismiss()
                            }}
                            className="w-full py-2.5 sm:py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-100 transition-all active:scale-95 text-sm sm:text-base"
                        >
                            🛍️ Start Budol Now
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
