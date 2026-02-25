'use client'
import { useState, useRef, useEffect } from "react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import Link from "next/link"
import { Camera, RefreshCw, CheckCircle2, X, Eye, EyeOff } from "lucide-react"
import { normalizePhone } from "@/lib/utils/phone-utils"

const AuthForm = ({ mode = 'login', onSuccess, onToggleMode, isModal = false, submitLabel }) => {
    const router = useRouter()
    const { login } = useAuth()
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const fileInputRef = useRef(null)
    const justRegisteredRef = useRef(false)

    const isLogin = mode === 'login'

    const [isLoading, setIsLoading] = useState(false)
    const [checkingEmail, setCheckingEmail] = useState(false)
    const [emailExists, setEmailExists] = useState(false)
    const [checkingPhone, setCheckingPhone] = useState(false)
    const [phoneExists, setPhoneExists] = useState(false)
    const [highlightSSO, setHighlightSSO] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const [registrationType, setRegistrationType] = useState('standard') // 'standard' or 'phone_only'
    const [loginMethod, setLoginMethod] = useState('email') // 'email' or 'phone'
    const [isOtpSent, setIsOtpSent] = useState(false)
    const [awaitingOtp, setAwaitingOtp] = useState(false)
    const [isSendingOtp, setIsSendingOtp] = useState(false)
    const [kycStatus, setKycStatus] = useState('unverified') // 'unverified', 'pending', 'verified'
    const [showKycPrompt, setShowKycPrompt] = useState(false)
    const [showCamera, setShowCamera] = useState(false)
    const [cameraStream, setCameraStream] = useState(null)
    const [selfieCaptured, setSelfieCaptured] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        image: '',
        _honey: ''
    })

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Clear form data when switching login methods, modes, or registration types to prevent prefilled/stray values
    useEffect(() => {
        if (justRegisteredRef.current) {
            // If we just registered, don't clear everything. 
            // We want to keep the phoneNumber so the user can immediately enter the OTP.
            justRegisteredRef.current = false;
            setFormData(prev => ({
                ...prev,
                name: '',
                email: '',
                password: '',
                confirmPassword: '',
                image: ''
            }));
            // isOtpSent and loginMethod are already set correctly in handleSubmit
            return;
        }

        setFormData({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            phoneNumber: '',
            image: ''
        });
        if (isLogin) {
            setIsOtpSent(false); // Reset OTP state when switching methods
        }
        setEmailExists(false);
        setPhoneExists(false);
    }, [loginMethod, mode, isLogin, registrationType]);

    // Debounced email check
    useEffect(() => {
        if (isLogin || !formData.email || formData.email.length < 5 || !formData.email.includes('@')) {
            setEmailExists(false);
            return;
        }

        const timer = setTimeout(async () => {
            setCheckingEmail(true);
            try {
                const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(formData.email)}`);
                const data = await res.json();
                if (data.exists) {
                    setEmailExists(true);
                    toast.error("This email is already registered in the ecosystem. Please log in instead.", { id: 'email-exists' });
                    setHighlightSSO(true);
                } else {
                    setEmailExists(false);
                }
            } catch (error) {
                console.error("Email check failed:", error);
            } finally {
                setCheckingEmail(false);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [formData.email, isLogin]);



    // Debounced phone check
    useEffect(() => {
        if (!formData.phoneNumber || formData.phoneNumber.length < 10) {
            setPhoneExists(false);
            setCheckingPhone(false);
            return;
        }

        // Set checking to true immediately to avoid "NOT FOUND" flicker during debounce
        setCheckingPhone(true);

        const timer = setTimeout(async () => {
            try {
                // Normalize phone number for the check: ensure it has +63 prefix
                const formattedPhone = normalizePhone(formData.phoneNumber);

                console.log(`[AuthForm] Normalized phone for check: ${formattedPhone}`);

                // For login mode, we want to know if it DOESN'T exist to show an error
                // For registration mode, we want to know if it DOES exist to show an error
                const res = await fetch(`/api/auth/check-phone?phone=${encodeURIComponent(formattedPhone)}`);
                const data = await res.json();

                console.log(`[AuthForm] Check phone result:`, data);

                if (res.ok && data) {
                    if (isLogin) {
                        if (data.exists) {
                            setPhoneExists(true);
                        } else {
                            setPhoneExists(false);
                            // Only show toast if we are sure it doesn't exist
                            toast.error("Mobile number not registered. Please create an account.", { id: 'phone-not-exists' });
                        }
                    } else {
                        if (data.exists) {
                            setPhoneExists(true);
                            toast.error("This phone number is already registered in the ecosystem.", { id: 'phone-exists' });
                            setHighlightSSO(true);
                        } else {
                            setPhoneExists(false);
                        }
                    }
                } else {
                    // If API fails, don't block the user but log it
                    console.error("[AuthForm] Failed to check phone number:", res.statusText);
                    // On error, we assume it might exist to avoid false "NOT FOUND"
                    setPhoneExists(true); 
                }
            } catch (error) {
                console.error("[AuthForm] Phone check error:", error);
                // On error, we assume it might exist to avoid false "NOT FOUND"
                setPhoneExists(true);
            } finally {
                setCheckingPhone(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.phoneNumber, isLogin]);

    // Clean up camera stream on unmount
    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop())
            }
        }
    }, [cameraStream])

    // Handle video stream assignment when camera is shown
    useEffect(() => {
        if (showCamera && cameraStream && videoRef.current) {
            videoRef.current.srcObject = cameraStream
        }
    }, [showCamera, cameraStream])

    const startCamera = async () => {
        const isDevelopment = process.env.NODE_ENV === 'development'
        const isSecureContext = typeof window !== 'undefined' && window.isSecureContext
        
        if (typeof window === 'undefined') return

        if (!navigator?.mediaDevices?.getUserMedia) {
            if (isDevelopment && !isSecureContext) {
                toast.error(
                    "Camera blocked by browser (Insecure Context). \n\nTo allow on local IP: \n1. Go to chrome://flags/#unsafely-treat-insecure-origin-as-secure \n2. Add '" + window.location.origin + "' \n3. Enable and Relaunch",
                    { duration: 6000 }
                )
            } else {
                toast.error("Camera access is not supported by your browser or environment.")
            }
            
            // Fallback to file upload
            fileInputRef.current?.click()
            return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 640 }
                } 
            })
            setCameraStream(stream)
            setShowCamera(true)
            setSelfieCaptured(false)
        } catch (err) {
            console.error("Error accessing camera:", err)
            toast.error("Unable to access camera. Falling back to file upload.")
            fileInputRef.current?.click()
        }
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Basic validation
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file.")
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size too large (max 10MB).")
            return
        }

        setIsUploading(true)
        try {
            // Convert file to base64 to use existing upload logic
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = async () => {
                const base64Data = reader.result
                
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64Data })
                })

                const data = await response.json()
                if (response.ok) {
                    setFormData(prev => ({ ...prev, image: data.url }))
                    toast.success("Photo uploaded successfully!")
                } else {
                    throw new Error(data.error || "Upload failed")
                }
                setIsUploading(false)
            }
        } catch (error) {
            console.error("File upload error:", error)
            toast.error("Failed to upload photo.")
            setIsUploading(false)
        }
    }

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop())
            setCameraStream(null)
        }
        setShowCamera(false)
    }

    const captureSelfie = async () => {
        if (!videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert canvas to base64
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        
        // Upload to Cloudinary immediately
        setIsUploading(true)
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData })
            })

            const data = await response.json()
            if (response.ok) {
                setFormData(prev => ({ ...prev, image: data.url }))
                toast.success("Selfie captured and uploaded!")
                setSelfieCaptured(true)
                stopCamera()
            } else {
                throw new Error(data.error || "Upload failed")
            }
        } catch (error) {
            console.error("Selfie upload error:", error)
            toast.error("Failed to upload selfie. Please try again.")
            setSelfieCaptured(false)
        } finally {
            setIsUploading(false)
        }
    }

    const retakeSelfie = () => {
        setSelfieCaptured(false)
        setFormData(prev => ({ ...prev, image: '' }))
        startCamera()
    }

    const handleChange = (e) => {
        const { name, value } = e.target

        if (name === 'phoneNumber') {
            // Only allow numbers
            let cleanValue = value.replace(/[^0-9]/g, '')
            
            // If it starts with 0, strip it (since we have +63 prefix)
            if (cleanValue.startsWith('0')) {
                cleanValue = cleanValue.substring(1)
            }

            // If it starts with 63 (e.g. pasted with country code), strip it
            if (cleanValue.startsWith('63') && cleanValue.length > 2) {
                cleanValue = cleanValue.substring(2)
            }
            
            // Limit to 10 digits (Philippine mobile numbers without prefix)
            if (cleanValue.length > 10) {
                cleanValue = cleanValue.substring(0, 10)
            }

            setFormData({
                ...formData,
                [name]: cleanValue
            })

            // Smarter identifier detection for Lazada-style UX
            if (isLogin && cleanValue.length >= 3 && loginMethod !== 'phone') {
                setLoginMethod('phone');
            }
            return
        }

        setFormData({
            ...formData,
            [name]: value
        })

        // Smarter identifier detection for Lazada-style UX
        if (name === 'email' && isLogin) {
            if (value.includes('@') && loginMethod !== 'email') {
                setLoginMethod('email');
            } else if (/^\d{3,}/.test(value) && loginMethod !== 'phone') {
                // If it looks like a phone number, switch to phone tab
                setLoginMethod('phone');
                setFormData(prev => ({
                    ...prev,
                    phoneNumber: value.replace(/[^0-9]/g, '').substring(0, 10),
                    email: '' // Clear email to avoid browser validation issues
                }));
                return; // Exit early since we updated formData
            }
        }
    }

    const handleSendOtp = async () => {
        const identifier = awaitingOtp 
            ? (loginMethod === 'phone' ? formData.phoneNumber : formData.email)
            : formData.phoneNumber;

        if (!identifier) {
            toast.error("Please enter your mobile number or email first")
            return
        }

        setIsSendingOtp(true)
        try {
            const formattedIdentifier = loginMethod === 'phone' || (awaitingOtp && !identifier.includes('@'))
                ? normalizePhone(identifier)
                : identifier;

            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: formattedIdentifier, action: 'send' })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to send code")

            if (!awaitingOtp) {
                setIsOtpSent(true)
                // Clear the password field so it's ready for the new OTP
                setFormData(prev => ({ ...prev, password: '' }))
            }
            
            toast.success("Verification code sent via Email and SMS")
        } catch (error) {
            toast.error(error.message)
        } finally {
            setIsSendingOtp(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)

        if (isLogin) {
            // Login logic
            try {
                let identifier = formData.email
                let authPayload = {
                    email: identifier,
                    password: formData.password
                }

                if (loginMethod === 'phone' || awaitingOtp) {
                    if (loginMethod === 'phone' && !isOtpSent && !awaitingOtp) {
                        toast.error("Please request a verification code first")
                        setIsLoading(false)
                        return
                    }
                    
                    if (loginMethod === 'phone') {
                        identifier = normalizePhone(formData.phoneNumber)
                    } else {
                        // Email mode awaiting OTP
                        identifier = formData.email
                    }

                    authPayload = {
                        email: identifier, // Still using 'email' field in payload for simplicity but it's phone/email identifier
                        password: formData.password, // This is the OTP code
                        isOtp: true
                    }
                }

                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(authPayload)
                })

                const data = await response.json()

                if (response.ok) {
                    if (data.status === 'OTP_REQUIRED') {
                        setAwaitingOtp(true)
                        setIsOtpSent(true)
                        setFormData(prev => ({ ...prev, password: '' }))
                        toast.success(data.message)
                        return
                    }

                    toast.success('Login successful!')
                    login(data.user, data.token)

                    if (onSuccess) {
                        onSuccess(data)
                    }
                } else {
                    toast.error(data.error || 'Login failed. Please try again.')
                    // Highlight SSO button if ecosystem account is detected
                    if (data.error?.includes('budolID')) {
                        setHighlightSSO(true)
                        setTimeout(() => setHighlightSSO(false), 5000)
                    }
                }
            } catch (error) {
                console.error('Login error:', error)
                toast.error('Login failed. Please try again.')
            } finally {
                setIsLoading(false)
            }
        } else {
            // Sign up logic
            if (emailExists) {
                toast.error("This email is already registered. Please use a different one or login with budolID.")
                setHighlightSSO(true)
                setIsLoading(false)
                return
            }

            if (phoneExists) {
                toast.error("This phone number is already registered.")
                setIsLoading(false)
                return
            }

            if (registrationType === 'standard') {
                if (formData.password !== formData.confirmPassword) {
                    toast.error('Passwords do not match')
                    setIsLoading(false)
                    return
                }

                if (formData.password.length < 6) {
                    toast.error('Password must be at least 6 characters')
                    setIsLoading(false)
                    return
                }
            }

            try {
                const finalPhone = normalizePhone(formData.phoneNumber)

                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        password: formData.password,
                        phoneNumber: finalPhone,
                        image: formData.image,
                        registrationType: registrationType,
                        _honey: formData._honey
                    })
                })

                const data = await response.json()

                if (response.ok) {
                    if (registrationType === 'phone_only') {
                        toast.success('Account created! A verification code (OTP) has been sent to your phone and email.')
                        
                        // Set state to show OTP input in login mode immediately
                        justRegisteredRef.current = true;
                        setLoginMethod('phone');
                        setIsOtpSent(true);
                        
                        if (onToggleMode) {
                            onToggleMode() // Switch to login
                        }
                    } else {
                        toast.success('Account created! Please check your email to verify your account.')
                        if (onToggleMode) {
                            onToggleMode() // Switch to login
                        } else {
                            // If no toggle mode handler (e.g. standalone page), clear form
                            setFormData({
                                name: '',
                                email: '',
                                password: '',
                                confirmPassword: '',
                                phoneNumber: '',
                                image: ''
                            })
                        }
                    }
                } else {
                    toast.error(data.error || 'Sign up failed. Please try again.')
                }
            } catch (error) {
                console.error('Sign up error:', error)
                toast.error('Sign up failed. Please try again.')
            } finally {
                setIsLoading(false)
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" autoComplete="off">
            {/* Honeypot field for anti-spam */}
            <input 
                type="text" 
                name="_honey" 
                value={formData._honey || ''}
                onChange={handleChange}
                style={{ display: 'none' }} 
                tabIndex="-1" 
                autoComplete="off" 
            />
            {isLogin && (
                <div className="flex bg-slate-100 p-1 rounded-lg mb-2 relative overflow-hidden">
                    <div 
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-900 rounded-md transition-all duration-300 ease-in-out z-0 ${loginMethod === 'email' ? 'left-1' : 'left-[calc(50%+2px)]'}`}
                    />
                    <button
                        type="button"
                        onClick={() => setLoginMethod('email')}
                        className={`relative z-10 flex-1 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all duration-300 ${loginMethod === 'email' ? "text-white" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        Email
                    </button>
                    <button
                        type="button"
                        onClick={() => setLoginMethod('phone')}
                        className={`relative z-10 flex-1 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all duration-300 ${loginMethod === 'phone' ? "text-white" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        Mobile
                    </button>
                </div>
            )}

            {!isLogin && (
                <div className="flex bg-slate-100 p-1 rounded-lg mb-2">
                    <button
                        type="button"
                        onClick={() => setRegistrationType('standard')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${registrationType === 'standard' ? "bg-green-500 shadow-sm text-white" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        Standard
                    </button>
                    <button
                        type="button"
                        onClick={() => setRegistrationType('phone_only')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${registrationType === 'phone_only' ? "bg-green-500 shadow-sm text-white" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        Quick (Phone Only)
                    </button>
                </div>
            )}

            {!isLogin && registrationType === 'phone_only' && (
                <p className="text-[10px] text-slate-500 italic px-1 mb-2">
                    Quick registration will generate a temporary profile. You can complete your KYC and profile details later in your account settings.
                </p>
            )}

            {!isLogin && (
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className={isModal ? "text-xs font-medium text-slate-600 uppercase" : "block text-sm font-medium text-slate-700"}>Phone Number</label>
                        {checkingPhone && <RefreshCw size={12} className="animate-spin text-indigo-500" />}
                        {!checkingPhone && phoneExists && <span className="text-[10px] text-rose-500 font-bold animate-pulse">ALREADY TAKEN</span>}
                        {!checkingPhone && formData.phoneNumber.length >= 10 && !phoneExists && <CheckCircle2 size={14} className="text-emerald-500" />}
                    </div>
                    <div className="flex gap-2">
                        <div className={`flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50 font-medium whitespace-nowrap ${isModal ? "p-2.5 px-3 text-sm" : "p-3 px-4 text-base"}`}>
                            <span className="text-[10px] mr-1 uppercase text-slate-400 font-bold">PH</span>
                            <span className="text-slate-600">+63</span>
                        </div>
                        <input
                                name="phoneNumber"
                                onChange={handleChange}
                                value={formData.phoneNumber}
                                className={`flex-1 outline-none border rounded-lg focus:ring-1 transition-all ${isModal ? "p-2.5 px-4" : "p-3 px-4 text-sm"} ${phoneExists ? "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-rose-500" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"}`}
                                type="tel"
                                placeholder="9XXXXXXXXX"
                                required={!isLogin}
                            />
                    </div>
                </div>
            )}

            {!isLogin && registrationType === 'standard' && (
                <div className="space-y-1">
                    <label className={isModal ? "text-xs font-medium text-slate-600 uppercase" : "block text-sm font-medium text-slate-700"}>Name</label>
                    <input
                        name="name"
                        onChange={handleChange}
                        value={formData.name}
                        className={`w-full outline-none border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all ${isModal ? "p-2.5 px-4" : "p-3 px-4"}`}
                        type="text"
                        placeholder="Enter your full name"
                        required={!isLogin}
                    />
                </div>
            )}

            {isLogin && (
                <div className="relative overflow-hidden min-h-[85px] transition-all duration-300">
                    <div className={`transition-all duration-300 transform ${loginMethod === 'email' ? 'translate-x-0 opacity-100 relative' : '-translate-x-full opacity-0 absolute pointer-events-none w-full'}`}>
                         <div className="space-y-1">
                            <label className={isModal ? "text-xs font-medium text-slate-600 uppercase" : "block text-sm font-medium text-slate-700"}>Email Address</label>
                            <input
                                name="email"
                                onChange={handleChange}
                                value={formData.email}
                                className={`w-full outline-none border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all ${isModal ? "p-2.5 px-4" : "p-3 px-4"}`}
                                type="email"
                                placeholder="example@email.com"
                                required={isLogin && loginMethod === 'email'}
                                disabled={isLogin && loginMethod !== 'email'}
                                tabIndex={loginMethod === 'email' ? 0 : -1}
                                autoComplete="email"
                            />
                        </div>
                    </div>
                    <div className={`transition-all duration-300 transform ${loginMethod === 'phone' ? 'translate-x-0 opacity-100 relative' : 'translate-x-full opacity-0 absolute pointer-events-none w-full'}`}>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className={isModal ? "text-xs font-medium text-slate-600 uppercase" : "block text-sm font-medium text-slate-700"}>Mobile Number</label>
                                {checkingPhone && <RefreshCw size={12} className="animate-spin text-indigo-500" />}
                                {!checkingPhone && formData.phoneNumber.length >= 10 && !phoneExists && <span className="text-[10px] text-rose-500 font-bold animate-pulse">NOT FOUND</span>}
                                {!checkingPhone && formData.phoneNumber.length >= 10 && phoneExists && <CheckCircle2 size={14} className="text-emerald-500" />}
                            </div>
                            <div className="flex gap-2">
                                <div className={`flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50 font-medium whitespace-nowrap ${isModal ? "p-2.5 px-3 text-sm" : "p-3 px-4 text-base"}`}>
                                    <span className="text-[10px] mr-1 uppercase text-slate-400 font-bold">PH</span>
                                    <span className="text-slate-600">+63</span>
                                </div>
                                <input
                                    name="phoneNumber"
                                    onChange={handleChange}
                                    value={formData.phoneNumber}
                                    className={`flex-1 outline-none border rounded-lg focus:ring-1 transition-all ${isModal ? "p-2.5 px-4" : "p-3 px-4 text-sm"} ${formData.phoneNumber.length >= 10 && !phoneExists ? "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-rose-500" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"}`}
                                    type="tel"
                                    placeholder="9XXXXXXXXX"
                                    required={isLogin && loginMethod === 'phone'}
                                    disabled={isLogin && loginMethod !== 'phone'}
                                    tabIndex={loginMethod === 'phone' ? 0 : -1}
                                    autoComplete="tel-national"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isLogin && registrationType === 'standard' && (
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className={isModal ? "text-xs font-medium text-slate-600 uppercase" : "block text-sm font-medium text-slate-700"}>
                            Email
                        </label>
                        {!isLogin && checkingEmail && <RefreshCw size={12} className="animate-spin text-indigo-500" />}
                        {!isLogin && !checkingEmail && emailExists && <span className="text-[10px] text-rose-500 font-bold animate-pulse">ALREADY REGISTERED</span>}
                        {!isLogin && !checkingEmail && formData.email.includes('@') && formData.email.length > 5 && !emailExists && <CheckCircle2 size={14} className="text-emerald-500" />}
                    </div>
                <input
                    name="email"
                    onChange={handleChange}
                    value={formData.email}
                    className={`w-full outline-none border rounded-lg focus:ring-1 transition-all ${isModal ? "p-2.5 px-4" : "p-3 px-4"} ${!isLogin && emailExists ? "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-rose-500" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"}`}
                    type="email"
                    placeholder="your.email@example.com"
                    required
                />
            </div>
            )}

            {(isLogin || registrationType === 'standard') && (
                <div className="relative overflow-hidden min-h-[85px] transition-all duration-300">
                    <div className={`transition-all duration-300 transform ${(loginMethod === 'email' || !isLogin) && !awaitingOtp ? 'translate-x-0 opacity-100 relative' : '-translate-x-full opacity-0 absolute pointer-events-none w-full'}`}>
                        <div className="space-y-1">
                            <label className={isModal ? "text-xs font-medium text-slate-600 uppercase" : "block text-sm font-medium text-slate-700"}>Password</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    onChange={handleChange}
                                    value={formData.password}
                                    className={`w-full outline-none border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all ${isModal ? "p-2.5 px-4 pr-10" : "p-3 px-4 pr-12"}`}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required={loginMethod === 'email' || !isLogin}
                                    disabled={isLogin && loginMethod === 'phone'}
                                    minLength={6}
                                    tabIndex={(loginMethod === 'email' || !isLogin) ? 0 : -1}
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {isLogin && (
                        <div className={`transition-all duration-300 transform ${loginMethod === 'phone' || awaitingOtp ? 'translate-x-0 opacity-100 relative' : 'translate-x-full opacity-0 absolute pointer-events-none w-full'}`}>
                            <div className="pt-2">
                                {!isOtpSent && !awaitingOtp ? (
                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={isSendingOtp}
                                        className="w-full py-3 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 transition-all border border-indigo-200 flex items-center justify-center gap-2"
                                        tabIndex={loginMethod === 'phone' && !isOtpSent ? 0 : -1}
                                    >
                                        {isSendingOtp ? <RefreshCw size={16} className="animate-spin" /> : null}
                                        Send Code via SMS & Email
                                    </button>
                                ) : (
                                    <div className="space-y-1">
                                         <div className="flex justify-between items-center">
                                             <label htmlFor="otp-input" className={isModal ? "text-xs font-medium text-slate-600 uppercase" : "block text-sm font-medium text-slate-700"}>Verification Code</label>
                                             <div className="flex gap-2">
                                                 {!awaitingOtp && (
                                                     <button 
                                                         type="button" 
                                                         onClick={() => setIsOtpSent(false)} 
                                                         className="text-[10px] text-indigo-600 font-medium hover:underline"
                                                         tabIndex={loginMethod === 'phone' && isOtpSent ? 0 : -1}
                                                     >
                                                         Change Number
                                                     </button>
                                                 )}
                                                 <button 
                                                     type="button" 
                                                     onClick={handleSendOtp}
                                                     disabled={isSendingOtp}
                                                     className="text-[10px] text-indigo-600 font-medium hover:underline flex items-center gap-1"
                                                     tabIndex={0}
                                                 >
                                                     {isSendingOtp && <RefreshCw size={8} className="animate-spin" />}
                                                     Resend Code
                                                 </button>
                                             </div>
                                         </div>
                                         <input
                                             id="otp-input"
                                             name="password"
                                             onChange={handleChange}
                                            value={formData.password}
                                            className={`w-full outline-none border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all ${isModal ? "p-2.5 px-4" : "p-3 px-4"}`}
                                            type="text"
                                            placeholder="Enter 6-digit code"
                                            required={loginMethod === 'phone' || awaitingOtp}
                                            disabled={loginMethod !== 'phone' && !awaitingOtp}
                                            maxLength={6}
                                            tabIndex={(loginMethod === 'phone' || awaitingOtp) && isOtpSent ? 0 : -1}
                                            autoComplete="one-time-code"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!isLogin && registrationType === 'standard' && (
                <div className="space-y-1">
                    <label className={isModal ? "text-xs font-medium text-slate-600 uppercase" : "block text-sm font-medium text-slate-700"}>Confirm Password</label>
                    <input
                        name="confirmPassword"
                        onChange={handleChange}
                        value={formData.confirmPassword}
                        className={`w-full outline-none border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all ${isModal ? "p-2.5 px-4" : "p-3 px-4"}`}
                        type="password"
                        placeholder="••••••••"
                        required={!isLogin}
                        minLength={6}
                        autoComplete="new-password"
                    />
                </div>
            )}

            {!isLogin && registrationType === 'standard' && (
                <div className="space-y-2">
                    <label className={isModal ? "text-xs font-medium text-slate-600 uppercase" : "block text-sm font-medium text-slate-700"}>
                        Profile Picture (Selfie)
                    </label>
                    
                    <div className="relative">
                        {/* Hidden canvas for capturing */}
                        <canvas ref={canvasRef} className="hidden" />
                        
                        {/* Hidden file input for fallback */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                        />

                        {!formData.image && !showCamera && (
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    className="w-full py-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 hover:border-indigo-300 transition-all text-slate-500 group"
                                >
                                    <Camera size={32} className="group-hover:scale-110 transition-transform" />
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm font-medium">Take a Selfie</span>
                                        <span className="text-[10px] opacity-60">Camera required</span>
                                    </div>
                                </button>
                                
                                <div className="flex items-center gap-2 px-1">
                                    <div className="h-[1px] flex-1 bg-slate-100" />
                                    <span className="text-[10px] text-slate-400 font-medium uppercase">or</span>
                                    <div className="h-[1px] flex-1 bg-slate-100" />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-2.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={14} />
                                    Upload Photo from Device
                                </button>
                            </div>
                        )}

                        {showCamera && (
                            <div className="relative rounded-xl overflow-hidden bg-black aspect-square max-w-[280px] sm:max-w-[320px] mx-auto">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover -scale-x-100"
                                />
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
                                    <button
                                        type="button"
                                        onClick={captureSelfie}
                                        disabled={isUploading}
                                        className="bg-white text-slate-900 p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={isUploading ? "Processing..." : "Capture"}
                                    >
                                        {isUploading ? (
                                            <RefreshCw size={24} className="animate-spin text-indigo-600" />
                                        ) : (
                                            <Camera size={24} />
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={stopCamera}
                                        className="bg-red-500 text-white p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                                        title="Cancel"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {formData.image && (
                            <div className="relative rounded-xl overflow-hidden aspect-square max-w-[200px] sm:max-w-[240px] mx-auto border-4 border-white shadow-md">
                                <img
                                    src={formData.image}
                                    alt="Selfie"
                                    className="w-full h-full object-cover"
                                />
                                {isUploading && (
                                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                        <RefreshCw size={24} className="animate-spin text-indigo-600" />
                                    </div>
                                )}
                                {!isUploading && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-sm">
                                        <CheckCircle2 size={16} />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={retakeSelfie}
                                    className="absolute bottom-0 left-0 right-0 bg-slate-900/80 text-white py-1.5 text-xs font-medium hover:bg-slate-900 transition-all"
                                >
                                    Retake
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <p className="text-[10px] text-slate-500 italic">
                        Taking a selfie reduces your fraud score and increases trust within the community.
                    </p>
                </div>
            )}

            {isLogin && (
                <div className="text-right">
                    <Link
                        href="/forgot-password"
                        onClick={() => {
                            if (isModal && onSuccess) onSuccess({ type: 'close' })
                        }}
                        className={`text-indigo-600 hover:text-indigo-700 font-medium ${isModal ? "text-xs hover:underline" : "text-sm"}`}
                    >
                        Forgot Password?
                    </Link>
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading || (!isLogin && (checkingPhone || phoneExists || formData.phoneNumber.length !== 10 || (registrationType === 'standard' && (checkingEmail || emailExists || !formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) || formData.password.length < 6 || formData.password !== formData.confirmPassword))))}
                className={`bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 active:scale-[0.98] transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed ${isModal ? "py-3 text-sm mt-2" : "py-3 text-sm"}`}
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    isLogin ? (submitLabel || 'Sign In') : 'Create Account'
                )}
            </button>

            {isLogin && (
                <div className="mb-2">
                    <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200"></span>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                            <span className="bg-white px-2 text-slate-400 font-medium text-center">
                                Quick Access to <span className="font-bold text-slate-500 lowercase">budol</span><span className="font-bold normal-case text-purple-600">Ecosystem</span>
                            </span>
                        </div>
                    </div>

                    {isMounted ? (
                        <button
                            type="button"
                            onClick={() => {
                                const ssoUrl = process.env.NEXT_PUBLIC_SSO_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:8000` : 'http://localhost:8000');
                                const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
                                const redirectUri = `${appUrl}/auth/callback`;
                                const apiKey = process.env.NEXT_PUBLIC_BUDOLID_API_KEY || 'bs_key_2025';
                                window.location.href = `${ssoUrl}/login?apiKey=${apiKey}&redirect_uri=${encodeURIComponent(redirectUri)}`;
                            }}
                            className={`w-full flex justify-center items-center gap-3 py-3 border rounded-lg shadow-sm text-sm font-semibold transition-all active:scale-[0.98] ${
                                highlightSSO 
                                ? "bg-rose-600 border-rose-700 text-white ring-2 ring-rose-500/20 scale-[1.02]" 
                                : "bg-rose-500 border-rose-600 text-white hover:bg-rose-600 hover:border-rose-700"
                            }`}
                        >
                            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px] text-white font-bold">B</div>
                            <span>Login with budolID</span>
                        </button>
                    ) : (
                        <div className="w-full py-3 border border-slate-200 rounded-lg bg-slate-50 animate-pulse h-[46px] flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
            )}
        </form>
    )
}

export default AuthForm
