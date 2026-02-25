'use client'

import { useState, useEffect } from 'react'
import { XIcon } from 'lucide-react'

export default function MarketingAdBanner() {
    const [settings, setSettings] = useState(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/system/settings')
                const data = await res.json()
                if (data && data.marketingAdsEnabled && data.selectedMarketingAd) {
                    setSettings(data)
                    // Check if user dismissed this specific ad session-wise
                    const dismissedAd = sessionStorage.getItem('dismissed_ad')
                    if (dismissedAd !== data.selectedMarketingAd) {
                        setIsVisible(true)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch marketing settings:', error)
            }
        }

        fetchSettings()
    }, [])

    const handleDismiss = () => {
        setIsVisible(false)
        if (settings?.selectedMarketingAd) {
            sessionStorage.setItem('dismissed_ad', settings.selectedMarketingAd)
        }
    }

    if (!isVisible || !settings) return null

    return (
        <div className="relative w-full bg-slate-900 overflow-hidden">
            <div className="max-w-[1440px] mx-auto relative group">
                <img
                    src={`/marketing-ads/${settings.selectedMarketingAd}`}
                    alt="Promotion"
                    className="w-full h-auto object-cover max-h-[80px] sm:max-h-[120px]"
                />
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                >
                    <XIcon size={16} />
                </button>
            </div>
        </div>
    )
}
