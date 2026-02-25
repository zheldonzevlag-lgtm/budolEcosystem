'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import Loading from '@/components/Loading'

export default function CouponsPage() {
    const [publicCoupons, setPublicCoupons] = useState([])
    const [memberCoupons, setMemberCoupons] = useState([])
    const [coopCoupons, setCoopCoupons] = useState([])
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [publicRes, memberRes, coopRes, userRes] = await Promise.all([
                fetch('/api/coupons?isPublic=true'),
                fetch('/api/coupons?forMember=true'),
                fetch('/api/coupons?forCoopMember=true'),
                fetch('/api/auth/me')
            ])

            const publicData = await publicRes.json()
            const memberData = await memberRes.json()
            const coopData = await coopRes.json()

            if (userRes.ok) {
                const userData = await userRes.json()
                setUser(userData.user)
            }

            setPublicCoupons(Array.isArray(publicData) ? publicData : [])
            setMemberCoupons(Array.isArray(memberData) ? memberData : [])
            setCoopCoupons(Array.isArray(coopData) ? coopData : [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleClaim = (coupon) => {
        if (coupon.forMember && !user?.isMember) {
            router.push('/pricing')
            return
        }
        if (coupon.forCoopMember && !user?.isCoopMember) {
            router.push('/pricing')
            return
        }

        navigator.clipboard.writeText(coupon.code)
        toast.success(`Coupon code ${coupon.code} copied to clipboard!`)
    }

    const CouponCard = ({ coupon, isLocked, lockType = 'member' }) => (
        <div className={`bg-white rounded-xl shadow-sm border ${isLocked ? 'border-slate-200 opacity-75' : lockType === 'coop' ? 'border-blue-100' : 'border-green-100'} p-6 relative overflow-hidden group transition hover:shadow-md`}>
            {isLocked && (
                <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                    <div className={`bg-white px-4 py-2 rounded-full shadow-sm border ${lockType === 'coop' ? 'border-blue-200' : 'border-slate-200'} flex items-center gap-2 text-sm font-medium text-slate-600`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        {lockType === 'coop' ? 'Coop Exclusive' : 'Member Exclusive'}
                    </div>
                </div>
            )}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-slate-800">{coupon.code}</h3>
                    <p className="text-sm text-slate-500">{coupon.description}</p>
                </div>
                <div className={`${lockType === 'coop' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'} px-3 py-1 rounded-full text-sm font-bold`}>
                    {coupon.discount}% OFF
                </div>
            </div>
            <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-slate-400">Expires: {new Date(coupon.expiresAt).toLocaleDateString()}</span>
                <button
                    onClick={() => handleClaim(coupon)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${isLocked
                        ? lockType === 'coop'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        : lockType === 'coop'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                >
                    {isLocked ? 'Unlock' : 'Copy Code'}
                </button>
            </div>
        </div>
    )

    if (loading) return <Loading />

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-800 mb-8">Available Coupons</h1>

                {coopCoupons.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-xl font-bold text-slate-700">Coop Member Exclusives</h2>
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold border border-blue-200">COOP</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {coopCoupons.map(coupon => (
                                <CouponCard
                                    key={coupon.code}
                                    coupon={coupon}
                                    isLocked={!user?.isCoopMember}
                                    lockType="coop"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {memberCoupons.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-xl font-bold text-slate-700">Plus Member Exclusives</h2>
                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-bold border border-yellow-200">GOLD</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {memberCoupons.map(coupon => (
                                <CouponCard
                                    key={coupon.code}
                                    coupon={coupon}
                                    isLocked={!user?.isMember}
                                    lockType="member"
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h2 className="text-xl font-bold text-slate-700 mb-6">Public Coupons</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {publicCoupons.map(coupon => (
                            <CouponCard
                                key={coupon.code}
                                coupon={coupon}
                                isLocked={false}
                            />
                        ))}
                        {publicCoupons.length === 0 && (
                            <p className="text-slate-500 col-span-full">No public coupons available at the moment.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
