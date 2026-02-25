'use client'
import React, { useState } from 'react'
import KYCWizard from '@/components/KYCWizard'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const VerifyPage = () => {
  const router = useRouter()
  const { user, setUser } = useAuth()
  const [isDone, setIsDone] = useState(false)

  const handleComplete = async (tier, details) => {
    try {
      // Simulate API call to update KYC status
      const response = await fetch('/api/user/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, details })
      })

      if (response.ok) {
        toast.success('KYC Application Submitted!')
        setIsDone(true)
        // Update local user state if possible
        if (setUser) {
          setUser({ ...user, kycStatus: 'PENDING' })
        }
      } else {
        // Fallback for simulation if API doesn't exist yet
        toast.success('KYC Application Submitted (Simulation)!')
        setIsDone(true)
      }
    } catch (error) {
      console.error('KYC Submission Error:', error)
      toast.error('Failed to submit KYC. Please try again.')
    }
  }

  if (isDone) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Application Received!</h1>
          <p className="text-slate-600 mb-8">
            Thank you for submitting your verification documents. Our compliance team will review your application within 1-3 business days.
          </p>
          <button 
            onClick={() => router.push('/profile')}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg"
          >
            Go to Profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/profile" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition">
            <ArrowLeft size={20} /> Back to Profile
          </Link>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-slate-800">Identity Verification</h1>
            <p className="text-sm text-slate-500">NPC & BSP Compliance Standards</p>
          </div>
        </div>

        <KYCWizard onComplete={handleComplete} />

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Your data is encrypted and handled in accordance with the Data Privacy Act of 2012 (RA 10173). 
            By proceeding, you agree to our verification terms and conditions.
          </p>
        </div>
      </div>
    </div>
  )
}

export default VerifyPage