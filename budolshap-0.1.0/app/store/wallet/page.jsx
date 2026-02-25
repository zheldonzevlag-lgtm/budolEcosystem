'use client'
import { useState, useEffect } from 'react'
import { WalletIcon, ArrowUpRightIcon, HistoryIcon } from 'lucide-react'
import Loading from '@/components/Loading'
import toast from 'react-hot-toast'
import { useAuth } from "@/context/AuthContext"
import { useStoreWallet } from '@/hooks/useStoreWallet'
import { formatManilaTime } from '@/lib/dateUtils'

export default function WalletPage() {
    const { user, isLoading: authLoading } = useAuth()
    const { wallet, isLoading, mutate } = useStoreWallet()
    const [requesting, setRequesting] = useState(false)
    const [payoutAmount, setPayoutAmount] = useState('')

    const handlePayout = async (e) => {
        e.preventDefault()
        const amount = Number(payoutAmount);
        if (!payoutAmount || amount <= 0) {
            toast.error('Invalid amount')
            return
        }
        if (amount > wallet.balance) {
            toast.error('Insufficient balance')
            return
        }

        setRequesting(true)
        try {
            const res = await fetch('/api/store/payouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amount })
            })

            if (res.ok) {
                toast.success('Payout requested successfully')
                setPayoutAmount('')
                mutate() // Refresh balance and transactions
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to request payout')
            }
        } catch (error) {
            console.error('Error requesting payout:', error)
            toast.error('An error occurred')
        } finally {
            setRequesting(false)
        }
    }

    if (isLoading || authLoading) return <Loading />

    return (
        <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Available Balance Card */}
                <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-4 opacity-90">
                        <WalletIcon size={24} />
                        <span className="font-medium">Available Balance</span>
                    </div>
                    <div className="text-4xl font-bold mb-2">
                        ₱{wallet?.balance?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-sm opacity-80">Ready for withdrawal</p>
                    <div className="mt-4 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                        <p className="text-xs opacity-70">Total Withdrawn</p>
                        <p className="font-semibold">₱{wallet?.transactions?.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0).toLocaleString() || '0.00'}</p>
                    </div>
                </div>

                {/* Pending Balance Card (Escrow) */}
                <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-10">
                        <svg width="200" height="200" viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r="80" fill="white" />
                        </svg>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4 opacity-90">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="font-medium">Pending Balance</span>
                        </div>
                        <div className="text-4xl font-bold mb-2">
                            ₱{wallet?.pendingBalance?.toLocaleString('en-PH', { minimumFractionDigits: 2 }) || '0.00'}
                        </div>
                        <p className="text-sm opacity-80">Held in escrow</p>
                        <div className="mt-4 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                            <p className="text-xs opacity-70">Total Earnings</p>
                            <p className="font-semibold">₱{((wallet?.balance || 0) + (wallet?.pendingBalance || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-1">About Escrow System</h4>
                        <p className="text-sm text-blue-800">
                            <strong>Pending Balance:</strong> Funds from paid orders held in escrow until order is DELIVERED ({wallet?.protectionWindowDays || 7} days after delivery).
                        </p>
                        <p className="text-sm text-blue-800 mt-1">
                            <strong>Available Balance:</strong> Funds released from escrow, ready for withdrawal.
                        </p>
                        <p className="text-xs text-blue-700 mt-2">
                            💡 Platform fee (5%) is automatically deducted from all payments.
                        </p>
                    </div>
                </div>
            </div>

            {/* Payout Request Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <ArrowUpRightIcon size={20} className="text-green-600" />
                    Request Payout
                </h3>
                <form onSubmit={handlePayout}>
                    <div className="mb-4">
                        <label className="block text-sm text-slate-500 mb-1">Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400">₱</span>
                            <input
                                type="number"
                                value={payoutAmount}
                                onChange={(e) => setPayoutAmount(e.target.value)}
                                className="w-full pl-8 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="0.00"
                                min="1"
                                max={wallet?.balance || 0}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Maximum: ₱{wallet?.balance?.toLocaleString('en-PH', { minimumFractionDigits: 2 }) || '0.00'}
                        </p>
                    </div>
                    <button
                        type="submit"
                        disabled={requesting || !wallet?.balance || wallet?.balance <= 0}
                        className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {requesting ? 'Processing...' : 'Withdraw Funds'}
                    </button>
                </form>
            </div>

            {/* Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                    <HistoryIcon size={20} className="text-slate-400" />
                    <h3 className="font-semibold text-slate-800">Transaction History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 text-sm uppercase">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Type</th>
                                <th className="p-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {wallet?.transactions?.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-500">No transactions yet</td>
                                </tr>
                            ) : (
                                wallet?.transactions?.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50">
                                        <td className="p-4 text-slate-600">
                                            {formatManilaTime(tx.createdAt, { dateStyle: 'short' })}
                                            <span className="text-xs text-slate-400 block">{formatManilaTime(tx.createdAt, { timeStyle: 'short' })}</span>
                                        </td>
                                        <td className="p-4 font-medium text-slate-800">{tx.description}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${tx.type === 'CREDIT' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className={`p-4 text-right font-semibold ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-slate-600'}`}>
                                            {tx.type === 'CREDIT' ? '+' : '-'}₱{tx.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
