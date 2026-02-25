import { useEffect, useState } from 'react'

export function useBudolShapShipping() {
    const [settings, setSettings] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/system/settings')

                if (!response.ok) {
                    throw new Error('Failed to load system settings')
                }

                const systemSettings = await response.json()
                setSettings({
                    enabled: systemSettings.budolShapShippingEnabled || false,
                    slaDays: systemSettings.budolShapShippingSLADays || 3,
                    waybillGeneration: systemSettings.budolShapWaybillGeneration || false
                })
            } catch (error) {
                console.error('Failed to fetch BudolShap shipping settings:', error)
                setSettings({
                    enabled: false,
                    slaDays: 3,
                    waybillGeneration: false
                })
            } finally {
                setLoading(false)
            }
        }

        fetchSettings()
    }, [])

    return { settings, loading }
}
