'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useAuthUI } from '@/context/AuthUIContext'
import { getToken } from '@/lib/auth-client'

export default function PricingPage() {
    const [loading, setLoading] = useState(false)
    const [coopLoading, setCoopLoading] = useState(false)
    const router = useRouter()
    const { showLogin } = useAuthUI()

    const handleJoin = async () => {
        setLoading(true)
        try {
            const token = getToken()
            const res = await fetch('/api/user/membership', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            const data = await res.json()

            if (res.ok) {
                toast.success(data.message || 'Your Plus Membership application has been submitted and is pending admin approval.')
                router.push('/')
            } else {
                if (res.status === 401) {
                    toast.error('Please login to join.')
                    showLogin()
                } else {
                    toast.error(data.error || 'Something went wrong')
                }
            }
        } catch (error) {
            toast.error('Failed to submit application')
        } finally {
            setLoading(false)
        }
    }


    const handleJoinCoop = async () => {
        setCoopLoading(true)
        try {
            const token = getToken()
            const res = await fetch('/api/user/coop-membership', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            const data = await res.json()

            if (res.ok) {
                toast.success(data.message || 'Your Coop Membership application has been submitted and is pending admin approval.')
                router.push('/')
            } else {
                if (res.status === 401) {
                    toast.error('Please login to join.')
                    showLogin()
                } else {
                    toast.error(data.error || 'Something went wrong')
                }
            }
        } catch (error) {
            toast.error('Failed to submit application')
        } finally {
            setCoopLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 py-20 px-4">
            <div className="max-w-6xl mx-auto text-center">
                <h1 className="text-4xl font-bold text-slate-800 mb-4">Choose Your <span className="text-green-600">Membership</span></h1>
                <p className="text-slate-600 mb-12 text-lg">Unlock exclusive deals, Get better coupon discounts, and special member-only coupons.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Plus Membership */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 flex flex-col">
                        <div className="bg-green-600 p-6 text-white">
                            <h2 className="text-2xl font-bold">Plus Membership</h2>
                            <p className="opacity-90 mt-2">Best value for shoppers</p>
                        </div>
                        <div className="p-8 flex-1 flex flex-col">
                            <div className="flex justify-center items-baseline mb-8">
                                <span className="text-5xl font-extrabold text-slate-800">Free</span>
                                <span className="text-slate-500 ml-2">/ forever</span>
                            </div>
                            <ul className="space-y-4 text-left mb-8 flex-1">
                                <li className="flex items-center text-slate-600">
                                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Exclusive Member Coupons
                                </li>
                                <li className="flex items-center text-slate-600">
                                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Early Access to Sales
                                </li>
                                <li className="flex items-center text-slate-600">
                                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Priority Support
                                </li>
                                <li className="flex items-center text-slate-600">
                                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Become a Seller Partner
                                </li>
                                <li className="flex items-center text-slate-600">
                                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Become a Coop Member/Partner
                                </li>
                            </ul>
                            <button
                                onClick={handleJoin}
                                disabled={loading}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : 'Join Plus'}
                            </button>
                            <p className="text-xs text-slate-400 mt-4">By joining, you agree to our Terms of Service.</p>
                        </div>
                    </div>

                    {/* Coop Membership */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 flex flex-col">
                        <div className="bg-blue-600 p-6 text-white">
                            <h2 className="text-2xl font-bold">Coop Membership</h2>
                            <p className="opacity-90 mt-2">For community partners</p>
                        </div>
                        <div className="p-8 flex-1 flex flex-col">
                            <div className="flex justify-center items-baseline mb-8">
                                <span className="text-4xl font-extrabold text-slate-800">Membership Fee</span>
                                {   /* <span className="text-slate-500 ml-2">/ forever</span> */}
                            </div>
                            <ul className="space-y-4 text-left mb-8 flex-1">
                                <li className="flex items-center text-slate-600">
                                    <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Coop Exclusive Deals
                                </li>
                                <li className="flex items-center text-slate-600">
                                    <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Community Voting Rights
                                </li>
                                <li className="flex items-center text-slate-600">
                                    <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Dividend Opportunities
                                </li>
                                <li className="flex items-center text-slate-600">
                                    <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Health Insurance Benefits
                                </li>
                                <li className="flex items-center text-slate-600">
                                    <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Loan Benefits
                                </li>
                                <li className="flex items-center text-slate-600">
                                    <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Tax Free Benefits on 3 million sales per annum
                                </li>
                            </ul>
                            <button
                                onClick={handleJoinCoop}
                                disabled={coopLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {coopLoading ? 'Processing...' : 'Join Coop'}
                            </button>
                            <p className="text-xs text-slate-400 mt-4">By joining, you agree to our Terms of Service.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}