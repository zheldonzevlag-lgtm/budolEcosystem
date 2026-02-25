'use client'
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Suspense } from "react"

const StoreLoginContent = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    // Default to /store if no redirect param, but if they came to login explicitly, maybe just /store
    const redirect = searchParams.get('redirect') || '/store'

    useEffect(() => {
        const url = new URL(window.location.origin)
        url.searchParams.set('showLogin', 'true')
        url.searchParams.set('redirect', redirect)
        router.replace(url.toString())
    }, [router, redirect])

    return null
}

const StoreLoginPage = () => {
    return (
        <Suspense fallback={null}>
            <StoreLoginContent />
        </Suspense>
    )
}

export default StoreLoginPage
