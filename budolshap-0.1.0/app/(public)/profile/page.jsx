'use client'
import React from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Package,
  Settings,
  LogOut,
  Clock,
  Pencil,
  Headset
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AddressModal from '@/components/AddressModal'
import { toast } from 'react-hot-toast'

const ProfilePage = () => {
  const { user, handleLogout, login } = useAuth()
  const router = useRouter()
  const [showEditModal, setShowEditModal] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef(null)

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to 70% quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
      };
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // specialized validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, WEBP)')
      return
    }

    setIsUploading(true)

    try {
      // 1. Compress image on client side
      const base64Image = await compressImage(file)

      // 2. Upload to Cloudinary with fallback
      let imageUrl = ""
      try {
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            image: base64Image,
            type: 'profile'
          })
        })

        if (!uploadResponse.ok) throw new Error('Cloudinary upload failed')
        const uploadData = await uploadResponse.json()
        imageUrl = uploadData.url
      } catch (error) {
        console.warn("Cloudinary upload failed, falling back to database storage:", error)
        toast.error("External upload timed out. Saving locally instead...", { duration: 4000 })
        imageUrl = base64Image // Fallback to base64
      }

      // 3. Update user profile
      const updateResponse = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl })
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update profile')
      }

      // 4. Reactive update
      window.dispatchEvent(new Event('login-success'))
      toast.success("Profile photo updated!")
      setIsUploading(false)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to update profile photo')
      setIsUploading(false)
    }
  }


  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading Profile...</div>
      </div>
    )
  }

  const kycStatus = user.kycStatus || 'UNVERIFIED'

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>

          {/* KYC Status Badge */}
          <div className={`absolute top-4 right-4 md:top-6 md:right-6 px-2.5 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold z-20 transition-all duration-300 ${kycStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm shadow-emerald-100' :
            kycStatus === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
              'bg-red-50 text-red-500 border border-red-200 shadow-sm shadow-red-100'
            }`}>
            <span className="animate-pulse flex items-center gap-1 md:gap-1.5">
              {kycStatus === 'VERIFIED' ? <ShieldCheck size={12} className="md:size-[14px]" /> : <ShieldAlert size={12} className="md:size-[14px]" />}
              {kycStatus === 'VERIFIED' ? 'VERIFIED' : 'UNVERIFIED'}
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="relative group">
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
              />

              {/* Profile Image with Overlay */}
              {/* Profile Image with Overlay */}
              <div
                className="relative group/image cursor-pointer w-24 h-24 mb-0"
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <div
                  className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-200 relative overflow-hidden"
                >
                  {isUploading ? (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/30 transition-all z-10 flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                      <Pencil size={24} className="text-white drop-shadow-md" />
                      <span className="sr-only">Change Photo</span>
                    </div>
                  )}

                  {user.image ? (
                    <img src={user.image} alt="Profile" className="w-full h-full rounded-3xl object-cover" />
                  ) : user.name ? (
                    user.name.charAt(0)
                  ) : (
                    <User size={40} />
                  )}
                </div>

                {/* Custom Tooltip for Image */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 group-hover/image:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-[100]">
                  Upload New Image
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="group/edit absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-slate-100 text-indigo-600 hover:text-indigo-700 hover:scale-110 transition-all active:scale-95 z-50"
              >
                <Pencil size={14} />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover/edit:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                  Edit Profile Data
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
              </button>
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800">{user.name || 'Anonymous User'}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                <span className="flex items-center gap-1.5 text-slate-500 text-sm bg-slate-100 px-3 py-1 rounded-full">
                  <Mail size={14} /> {user.email || 'No email provided'}
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 text-sm bg-slate-100 px-3 py-1 rounded-full">
                  <Phone size={14} /> {user.phoneNumber || 'No phone provided'}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full md:w-auto md:hidden">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition font-medium border border-red-100"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content (2/3) */}
          <div className="md:col-span-2 space-y-6">

            {/* Identity Verification Section (Compliance Shield) */}
            <div className="bg-[#0f172a] text-white rounded-3xl shadow-2xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -mr-32 -mt-32 transition-all group-hover:bg-indigo-500/20"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                      Compliance Shield
                      {kycStatus === 'VERIFIED' ? (
                        <ShieldCheck className="text-emerald-400" size={20} />
                      ) : (
                        <ShieldAlert className="text-amber-400 animate-pulse" size={20} />
                      )}
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Identity Verification Status</p>
                  </div>
                </div>


                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className={`p-2 rounded-lg ${kycStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Personal Identity</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Government-issued ID verification for consumer protection.</p>
                    </div>
                    {kycStatus === 'VERIFIED' && <ShieldCheck className="ml-auto text-emerald-400" size={16} />}
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Anti-Fraud Protection</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Automated screening for secure transactions.</p>
                    </div>
                  </div>
                </div>

                {kycStatus !== 'VERIFIED' && kycStatus !== 'PENDING' && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 mb-6 animate-pulse">
                    <div className="bg-amber-500/20 p-2 rounded-xl">
                      <ShieldAlert className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-amber-200/90 font-medium leading-relaxed">
                        Complete your identity verification to unlock full wallet features, higher transaction limits, and enhanced security.
                      </p>
                    </div>
                  </div>
                )}

                {kycStatus !== 'VERIFIED' && kycStatus !== 'PENDING' ? (
                  <Link
                    href="/profile/verify"
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-900/20 group"
                  >
                    Start Verification Process
                    <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : kycStatus === 'PENDING' ? (
                  <div className="w-full flex items-center justify-center gap-3 bg-amber-500/10 text-amber-400 py-4 rounded-2xl font-bold border border-amber-500/20">
                    <Clock size={18} />
                    Review in Progress
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-center gap-3 bg-emerald-500/10 text-emerald-400 py-4 rounded-2xl font-bold border border-emerald-500/20">
                    <ShieldCheck size={18} />
                    Verified Account
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity / Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-4">
                  <Package size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-800">0</h3>
                <p className="text-sm text-slate-500 font-medium">Active Orders</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit mb-4">
                  <Clock size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-800">0</h3>
                <p className="text-sm text-slate-500 font-medium">Completed</p>
              </div>
            </div>

          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4">Account Settings</h3>
              <nav className="space-y-1">
                <Link href="/orders" className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition group">
                  <div className="flex items-center gap-3 text-slate-600 group-hover:text-slate-900">
                    <Package size={18} />
                    <span className="text-sm font-medium">My Orders</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </Link>
                <Link href="/address" className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition group">
                  <div className="flex items-center gap-3 text-slate-600 group-hover:text-slate-900">
                    <Settings size={18} />
                    <span className="text-sm font-medium">Manage Address</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </Link>
                <Link href="/profile/settings" className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition group">
                  <div className="flex items-center gap-3 text-slate-600 group-hover:text-slate-900">
                    <Settings size={18} />
                    <span className="text-sm font-medium">Security Settings</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </Link>
              </nav>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
              <h3 className="font-bold mb-2">Need Help?</h3>
              <p className="text-xs text-indigo-100 mb-4">Our <span className="font-bold text-slate-300">budol</span><span className="font-bold text-green-500">Care</span> team is available <span className="font-medium text-amber-200">24/7</span> to assist with your verification or orders.</p>
              <Link href="/support" className="block w-full bg-white/20 hover:bg-white/30 py-2 rounded-xl text-sm font-bold transition">
                <span className="w-full flex items-center justify-center gap-1">
                  <Headset size={16} strokeWidth={3} className="text-amber-300" />
                  <span><span className="font-bold text-slate-300">budol</span><span className="font-bold text-green-500">Care</span></span>
                </span>
              </Link>
            </div>
          </div>

        </div>
      </div >

      {showEditModal && (
        <AddressModal
          setShowAddressModal={setShowEditModal}
          mode="profile"
        />
      )}
    </div >
  )
}

export default ProfilePage
