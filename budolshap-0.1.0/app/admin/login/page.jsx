'use client'
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Suspense } from "react"

const AdminLoginContent = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirect = searchParams.get('redirect') || '/admin'

    useEffect(() => {
        const url = new URL(window.location.origin)
        url.searchParams.set('showLogin', 'true')
        url.searchParams.set('redirect', redirect)
        router.replace(url.toString())
    }, [router, redirect])

    return null
}

const AdminLoginPage = () => {
    return (
        <Suspense fallback={null}>
            <AdminLoginContent />
        </Suspense>
    )
}

export default AdminLoginPage
