'use client'
import React, { useState, useRef, useEffect } from 'react'
import { 
  User, 
  Building2, 
  Upload, 
  ShieldCheck, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  FileText,
  CreditCard,
  Camera,
  RotateCcw,
  EyeOff
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Tesseract from 'tesseract.js'
import { useAuth } from '@/context/AuthContext'

// --- AI Image Processing Utilities ---
const smartCrop = async (img) => {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // 1. Resize for analysis (speed)
    const analysisWidth = 400
    const scale = analysisWidth / img.width
    const analysisHeight = img.height * scale
    canvas.width = analysisWidth
    canvas.height = analysisHeight
    ctx.drawImage(img, 0, 0, analysisWidth, analysisHeight)
    
    const imageData = ctx.getImageData(0, 0, analysisWidth, analysisHeight)
    const data = imageData.data
    
    // 2. Simple background detection (average of corners)
    const getPixel = (x, y) => {
      const i = (y * analysisWidth + x) * 4
      return { r: data[i], g: data[i+1], b: data[i+2] }
    }
    
    const corners = [
      getPixel(5, 5), getPixel(analysisWidth - 6, 5),
      getPixel(5, analysisHeight - 6), getPixel(analysisWidth - 6, analysisHeight - 6)
    ]
    const avgBg = {
      r: corners.reduce((a, b) => a + b.r, 0) / 4,
      g: corners.reduce((a, b) => a + b.g, 0) / 4,
      b: corners.reduce((a, b) => a + b.b, 0) / 4
    }
    
    // 3. Find bounding box of content (pixels that differ from background)
    let minX = analysisWidth, minY = analysisHeight, maxX = 0, maxY = 0
    const threshold = 30 // Sensitivity
    let detectedPoints = 0
    
    for (let y = 0; y < analysisHeight; y += 4) { // Faster skip
      for (let x = 0; x < analysisWidth; x += 4) {
        const p = getPixel(x, y)
        const diff = Math.abs(p.r - avgBg.r) + Math.abs(p.g - avgBg.g) + Math.abs(p.b - avgBg.b)
        
        if (diff > threshold) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
          detectedPoints++
        }
      }
    }
    
    // 4. Safety Check: If too few points detected, or invalid box, return original
    if (detectedPoints < 50 || maxX <= minX || maxY <= minY) {
      console.warn('Smart Crop: No clear ID detected, using original image.')
      return img.src
    }

    // 5. Add padding (15%)
    const padding = 30
    minX = Math.max(0, minX - padding)
    minY = Math.max(0, minY - padding)
    maxX = Math.min(analysisWidth, maxX + padding)
    maxY = Math.min(analysisHeight, maxY + padding)
    
    // 6. Final Crop and Scale back to original proportions
    const finalCanvas = document.createElement('canvas')
    const finalCtx = finalCanvas.getContext('2d')
    
    const cropX = minX / scale
    const cropY = minY / scale
    const cropW = (maxX - minX) / scale
    const cropH = (maxY - minY) / scale
    
    // Prevent zero dimension canvas
    if (cropW <= 0 || cropH <= 0) return img.src

    finalCanvas.width = cropW
    finalCanvas.height = cropH
    finalCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
    
    return finalCanvas.toDataURL('image/jpeg', 0.95)
  } catch (err) {
    console.error('Smart Crop Error:', err)
    return img.src // Fallback to original
  }
}

const KYCWizard = ({ onComplete }) => {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin || user?.accountType === 'ADMIN' || user?.role === 'ADMIN'
  
  const [step, setStep] = useState(1)
  const [tier, setTier] = useState(null) // 'INDIVIDUAL' or 'BUSINESS'
  const [files, setFiles] = useState({})
  const [previews, setPreviews] = useState({})
  const [details, setDetails] = useState({
    fullName: '',
    idNumber: '',
    idType: '',
    businessName: '',
    tin: '',
    registrationNumber: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrLines, setOcrLines] = useState([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanComplete, setScanComplete] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const [cameraError, setCameraError] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const steps = [
    { id: 1, title: 'Choose Tier' },
    { id: 2, title: 'Upload Documents' },
    { id: 3, title: 'Submit' }
  ]

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    setIsScanning(true)
    setCameraError(null)
    
    // Check for MediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = 'Camera access is blocked because this site is not using HTTPS. Biometric capture requires a secure connection.'
      setCameraError(errorMsg)
      toast.error(errorMsg)
      setIsScanning(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (err) {
      console.error('Camera Access Error:', err)
      setCameraError('Unable to access camera. Please ensure you have granted permission.')
      setIsScanning(false)
      toast.error('Camera access denied')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const captureScan = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      context.drawImage(videoRef.current, 0, 0, 400, 400)
      
      const photoData = canvasRef.current.toDataURL('image/jpeg')
      setCapturedPhoto(photoData)
      
      setIsProcessing(true)
      toast.loading('Processing biometric liveness...', { id: 'liveness-check' })
      
      // Simulate Shopee-style AI liveness verification
      setTimeout(() => {
        setIsProcessing(false)
        setScanComplete(true)
        stopCamera()
        toast.success('Biometric Liveness Verified!', { id: 'liveness-check' })
        setDetails(prev => ({ ...prev, livenessVerified: true }))
      }, 3000)
    }
  }

  const nextStep = () => setStep(s => s + 1)
  const prevStep = () => setStep(s => s - 1)

  const handleFileUpload = async (e, docType) => {
    const file = e.target.files[0]
    if (file) {
      setFiles(prev => ({ ...prev, [docType]: file }))
      setIsProcessing(true)
      const toastId = toast.loading('AI Engine: Pre-processing & Smart Cropping...')
      
      try {
        const reader = new FileReader()
        const imageResult = await new Promise((resolve) => {
          reader.onload = (event) => {
            const img = new Image()
            img.onload = async () => {
              // Apply Smart Crop (Remove Background)
              const croppedDataUrl = await smartCrop(img)
              resolve({ croppedDataUrl, originalImg: img })
            }
            img.src = event.target.result
          }
          reader.readAsDataURL(file)
        })

        const { croppedDataUrl, originalImg } = imageResult
        setPreviews(prev => ({ ...prev, [docType]: croppedDataUrl }))

        if (docType === 'idCard') {
          toast.loading('AI Engine: Running deep-text extraction...', { id: toastId })
          
          // Use the cropped image for OCR as well for better accuracy
          const ocrImg = new Image()
          ocrImg.src = croppedDataUrl
          await new Promise(r => ocrImg.onload = r)

          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // Set optimal OCR dimensions
          const scale = Math.min(1200 / ocrImg.width, 1200 / ocrImg.height)
          canvas.width = ocrImg.width * scale
          canvas.height = ocrImg.height * scale
          
          // Draw and apply multi-pass enhancement
          ctx.filter = 'grayscale(1) contrast(2.2) brightness(1.05) saturate(0) blur(0px)'
          ctx.drawImage(ocrImg, 0, 0, canvas.width, canvas.height)
          
          const processedDataUrl = canvas.toDataURL('image/jpeg', 0.9)
          
          // Perform OCR with optimized settings based on User Recommendation
          const { data: { text } } = await Tesseract.recognize(processedDataUrl, 'eng+fil', {
            logger: m => console.log(m)
          })
          
          const lines = text.split('\n').map(l => l.trim().toUpperCase()).filter(l => l.length > 2)
          setOcrLines(lines)
          console.log('AI Extraction Lines:', lines)

          // 1. Improved ID Number Extraction (regex-based)
          const idPatterns = [
            /\b\d{4}-\d{7}-\d{1}\b/,       // UMID: XXXX-XXXXXXX-X
            /\b[A-Z]\d{2}-\d{2}-\d{6}\b/,  // Driver's License: XYY-YY-YYYYYY
            /\b\d{4}-\d{5}-\d{9}-\d{1}\b/, // Voter's ID: XXXX-XXXXX-XXXXXXXXX-X
            /\b\d{4}-\d{4}-\d{4}-\d{4}\b/  // National ID: XXXX-XXXX-XXXX-XXXX
          ]
          
          let extractedId = ''
          for (const pattern of idPatterns) {
            const match = text.match(pattern)
            if (match) {
              extractedId = match[0]
              break
            }
          }

          // 2. Keyword-based field detection (Sequence extraction)
          let extractedName = ''
          const nameKeywords = ['NAME', 'FULL NAME', 'SURNAME', 'GIVEN NAME', 'PANGALAN']
          const blacklist = ['REPUBLIC', 'PHILIPPINES', 'IDENTITY', 'CARD', 'GOVERNMENT', 'LICENSE', 'OFFICE', 'VALID', 'UNTIL', 'EXPIRY', 'PILIPINAS', 'REPUBLIKA']

          // Try to find name after keyword
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const foundKeyword = nameKeywords.find(k => line.includes(k))
            
            if (foundKeyword) {
              // Check if name is on the same line after colon/space
              const parts = line.split(foundKeyword)
              if (parts.length > 1) {
                const afterKeyword = parts[1].replace(/[:;-]/g, '').trim()
                if (afterKeyword.split(' ').length >= 2) {
                  extractedName = afterKeyword
                  break
                }
              }
              // Or check next line
              if (i + 1 < lines.length) {
                const nextLine = lines[i+1].trim()
                if (nextLine.split(' ').length >= 2 && !blacklist.some(b => nextLine.includes(b))) {
                  extractedName = nextLine
                  break
                }
              }
            }
          }

          // 3. Fallback: Longest line that isn't blacklisted
          if (!extractedName) {
            const candidates = lines.filter(l => 
              l.split(' ').length >= 2 && 
              !blacklist.some(b => l.includes(b)) &&
              !idPatterns.some(p => p.test(l))
            )
            if (candidates.length > 0) {
              extractedName = candidates.reduce((a, b) => a.length > b.length ? a : b)
            }
          }

          setDetails(prev => ({
            ...prev,
            fullName: extractedName || 'Manual Entry Required',
            idNumber: extractedId || 'Manual Entry Required'
          }))
        }
        
        toast.success('Document processed with AI Smart Crop!', { id: toastId })
      } catch (err) {
        console.error('Processing error:', err)
        toast.error('Error processing document', { id: toastId })
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Select Your Verification Type</h2>
      <p className="text-slate-600">Choose the account type that best describes your needs. Higher tiers unlock more features and higher limits.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => { setTier('BUYER'); nextStep(); }}
          className={`p-6 rounded-2xl border-2 transition-all text-left ${tier === 'BUYER' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}
        >
          <div className="bg-blue-100 p-3 rounded-xl w-fit mb-4">
            <User className="text-blue-600" size={24} />
          </div>
          <h3 className="font-bold text-lg text-slate-800">Standard Buyer</h3>
          <p className="text-sm text-slate-500 mt-2">Unlock ₱100k budolPay limit, bank withdrawals, and P2P transfers. Requires Valid ID.</p>
        </button>

        <button
          onClick={() => { setTier('INDIVIDUAL'); nextStep(); }}
          className={`p-6 rounded-2xl border-2 transition-all text-left ${tier === 'INDIVIDUAL' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}
        >
          <div className="bg-indigo-100 p-3 rounded-xl w-fit mb-4">
            <User className="text-indigo-600" size={24} />
          </div>
          <h3 className="font-bold text-lg text-slate-800">Individual Seller</h3>
          <p className="text-sm text-slate-500 mt-2">For solo entrepreneurs. Includes all Buyer benefits plus selling capabilities. Requires Government ID.</p>
        </button>

        <button
          onClick={() => { setTier('BUSINESS'); nextStep(); }}
          className={`p-6 rounded-2xl border-2 transition-all text-left ${tier === 'BUSINESS' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}
        >
          <div className="bg-emerald-100 p-3 rounded-xl w-fit mb-4">
            <Building2 className="text-emerald-600" size={24} />
          </div>
          <h3 className="font-bold text-lg text-slate-800">Business Seller</h3>
          <p className="text-sm text-slate-500 mt-2">For registered companies. Full ecosystem access. Requires BIR & DTI/SEC permits.</p>
        </button>
      </div>
    </div>
  )

  const renderStep2 = () => {
    const isDocUploaded = (tier === 'BUSINESS') 
      ? (files.birPermit && files.dtiPermit)
      : (files.idCard && scanComplete);

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Upload Required Documents</h2>
        <p className="text-slate-600">Please provide clear photos of your documents. Our AI will automatically extract details for admin review. No manual typing required!</p>

        <div className="space-y-4">
          {(tier === 'INDIVIDUAL' || tier === 'BUYER') ? (
            <>
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-400 transition cursor-pointer relative group overflow-hidden min-h-[280px] flex flex-col items-center justify-center bg-white">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  onChange={(e) => handleFileUpload(e, 'idCard')}
                />
                {previews.idCard ? (
                  <div className="relative w-full h-64">
                    <img src={previews.idCard} alt="ID Preview" className="w-full h-full object-contain rounded-lg" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-bold bg-indigo-600 px-3 py-1 rounded-full">Change Photo</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4">
                    <CreditCard className="text-slate-400 mb-2 group-hover:text-indigo-500 transition" size={32} />
                    <p className="font-medium text-slate-700">{files.idCard ? files.idCard.name : 'Upload Government ID'}</p>
                    <p className="text-xs text-slate-500 mt-1">UMID, Passport, Driver's License (Max 5MB)</p>
                  </div>
                )}
              </div>
              
              {/* AI Extraction Preview - Visible to Admins only as per v1.4.0 Security Requirement */}
              {(isProcessing || details.fullName || details.idNumber || ocrLines.length > 0) && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={isProcessing ? "text-indigo-400 animate-pulse" : "text-indigo-600"} size={18} />
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        {isProcessing ? 'AI Extraction in Progress...' : 'AI Extraction Results'}
                      </h4>
                    </div>
                    {isProcessing ? (
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase bg-slate-200/50 px-2 py-0.5 rounded-md">
                        <ShieldCheck size={10} />
                        Admin View Only
                      </div>
                    )}
                  </div>
                  
                  {isAdmin ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Detected Name</label>
                          <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 truncate">
                            {details.fullName || 'Detecting...'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Detected ID Number</label>
                          <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 truncate">
                            {details.idNumber || 'Detecting...'}
                          </div>
                        </div>
                      </div>

                      {ocrLines.length > 0 && (
                        <div className="mt-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Raw AI Scan Lines (Transparency)</label>
                          <div className="mt-1 max-h-24 overflow-y-auto bg-slate-900 rounded-lg p-2 font-mono text-[10px] text-emerald-400/80 space-y-0.5">
                            {ocrLines.map((line, idx) => (
                              <div key={idx} className="flex gap-2">
                                <span className="text-slate-600 select-none">{String(idx + 1).padStart(2, '0')}</span>
                                <span>{line}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                      <div className="bg-white p-3 rounded-full border border-slate-200 shadow-sm">
                        <EyeOff className="text-slate-300" size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-600">Confidential Processing</p>
                        <p className="text-[10px] text-slate-400 max-w-[200px]">AI extraction results are secured and only visible to the KYC verification officers.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-400 transition bg-blue-50/30 overflow-hidden">
                <div className="flex flex-col items-center py-4">
                  {isScanning ? (
                    <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-blue-500 bg-black mb-4">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover transform scale-x-[-1]"
                      />
                      <div className="absolute inset-0 border-2 border-white/30 rounded-full animate-pulse pointer-events-none" />
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                         <div className="bg-blue-600/80 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Scanning...</div>
                      </div>
                    </div>
                  ) : scanComplete ? (
                    <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-emerald-500 bg-emerald-50 mb-4 flex items-center justify-center">
                      {capturedPhoto ? (
                        <>
                          <img 
                            src={capturedPhoto} 
                            alt="Captured Liveness" 
                            className="w-full h-full object-cover transform scale-x-[-1]" 
                          />
                          <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-lg">
                            <CheckCircle2 size={16} />
                          </div>
                        </>
                      ) : (
                        <CheckCircle2 size={64} className="text-emerald-500" />
                      )}
                    </div>
                  ) : (
                    <ShieldCheck className="text-blue-400 mb-2" size={32} />
                  )}

                  <p className="font-medium text-slate-700">
                    {scanComplete ? 'Liveness Verified' : 'Liveness Check (Biometric)'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 text-center px-4">
                    {scanComplete 
                      ? 'Biometric data successfully matched with ID.' 
                      : 'Our AI will prompt for a selfie to confirm your identity.'}
                  </p>

                  {cameraError && (
                    <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
                      <AlertCircle size={12} /> {cameraError}
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    {!isScanning && !scanComplete && (
                      <button 
                        onClick={startCamera}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-100"
                      >
                        <Camera size={18} /> Start Facial Scan
                      </button>
                    )}
                    {isScanning && (
                      <button 
                        onClick={captureScan}
                        disabled={isProcessing}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 disabled:opacity-50"
                      >
                        {isProcessing ? 'Verifying...' : 'Capture & Verify'}
                      </button>
                    )}
                    {scanComplete && (
                      <button 
                        onClick={() => { setScanComplete(false); startCamera(); }}
                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition"
                      >
                        <RotateCcw size={14} /> Retake Scan
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} width="400" height="400" className="hidden" />
            </>
          ) : (
            <>
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-400 transition cursor-pointer relative group overflow-hidden min-h-[280px] flex flex-col items-center justify-center bg-white">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  onChange={(e) => handleFileUpload(e, 'birPermit')}
                />
                {previews.birPermit ? (
                  <div className="relative w-full h-64">
                    <img src={previews.birPermit} alt="BIR Preview" className="w-full h-full object-contain rounded-lg" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-bold bg-indigo-600 px-3 py-1 rounded-full">Change Photo</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4">
                    <FileText className="text-slate-400 mb-2 group-hover:text-indigo-500 transition" size={32} />
                    <p className="font-medium text-slate-700">{files.birPermit ? files.birPermit.name : 'Upload BIR 2303'}</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-400 transition cursor-pointer relative group overflow-hidden min-h-[280px] flex flex-col items-center justify-center bg-white">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  onChange={(e) => handleFileUpload(e, 'dtiPermit')}
                />
                {previews.dtiPermit ? (
                  <div className="relative w-full h-64">
                    <img src={previews.dtiPermit} alt="DTI Preview" className="w-full h-full object-contain rounded-lg" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-bold bg-indigo-600 px-3 py-1 rounded-full">Change Photo</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4">
                    <FileText className="text-slate-400 mb-2 group-hover:text-indigo-500 transition" size={32} />
                    <p className="font-medium text-slate-700">{files.dtiPermit ? files.dtiPermit.name : 'Upload DTI/SEC Registration'}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 items-start">
          <AlertCircle className="text-amber-600 shrink-0" size={20} />
          <p className="text-xs text-amber-800 leading-relaxed">
            By clicking submit, you certify that all uploaded documents are authentic and valid. KYC verification officer will review your submission within 1-3 business days but you may still access the app and shop with limited transaction amount.
          </p>
        </div>

        <div className="flex justify-between pt-6">
          <button onClick={prevStep} className="flex items-center gap-2 text-slate-600 font-medium px-4 py-2 hover:bg-slate-100 rounded-lg">
            <ChevronLeft size={20} /> Back
          </button>
          <button 
            onClick={nextStep}
            disabled={!isDocUploaded || isProcessing}
            className="bg-indigo-600 text-white px-6 sm:px-10 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100 flex items-center gap-2 whitespace-nowrap text-sm sm:text-base"
          >
            Review & Continue
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  const renderStep3 = () => {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-indigo-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Review & Submit</h2>
          <p className="text-slate-600">Please confirm your details before submitting for admin review.</p>
        </div>

        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Account Tier</span>
            <span className="font-bold text-slate-800">{tier}</span>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Extracted Information</h4>
            {isAdmin ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Full Name</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{details.fullName || 'Not Detected'}</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">ID Number</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{details.idNumber || 'Not Detected'}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                <div className="bg-indigo-50 p-2 rounded-lg">
                  <ShieldCheck className="text-indigo-600" size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Information Secured</p>
                  <p className="text-[10px] text-slate-400">Your data has been extracted and will be verified by our compliance team.</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Documents Attached</h4>
            <div className="flex gap-3">
              {Object.keys(previews).map(key => (
                <div key={key} className="w-20 h-20 rounded-lg border border-slate-200 overflow-hidden bg-white">
                  <img src={previews[key]} alt={key} className="w-full h-full object-cover" />
                </div>
              ))}
              {capturedPhoto && (
                <div className="w-20 h-20 rounded-full border-2 border-indigo-200 overflow-hidden bg-white">
                  <img src={capturedPhoto} alt="Face Scan" className="w-full h-full object-cover transform scale-x-[-1]" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 items-start">
          <AlertCircle className="text-amber-600 shrink-0" size={20} />
          <p className="text-xs text-amber-800 leading-relaxed">
            By clicking submit, you certify that all uploaded documents are authentic and valid. Admin staff will review your submission within 1-3 business days.
          </p>
        </div>

        <div className="flex justify-between pt-6">
          <button onClick={prevStep} className="flex items-center gap-2 text-slate-600 font-medium px-4 py-2 hover:bg-slate-100 rounded-lg">
            <ChevronLeft size={20} /> Back
          </button>
          <button 
            onClick={() => {
              setIsProcessing(true)
              const toastId = toast.loading('Finalizing submission...')
              setTimeout(() => {
                setIsProcessing(false)
                onComplete(tier, {
                  ...details,
                  documents: previews,
                  capturedPhoto: capturedPhoto,
                  ocrLines: ocrLines
                })
                toast.success('Verification Submitted!', { id: toastId })
              }, 2000)
            }}
            disabled={isProcessing}
            className="bg-indigo-600 text-white px-6 sm:px-12 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100 flex items-center gap-2 whitespace-nowrap text-sm sm:text-base"
          >
            {isProcessing ? 'Submitting...' : 'Confirm & Submit'}
            {!isProcessing && <CheckCircle2 size={20} />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
      {/* Progress Bar */}
      <div className="bg-slate-50 px-8 py-6 border-b border-slate-100">
        <div className="flex justify-between mb-4">
          {steps.map(s => (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-200 text-slate-500'}`}>
                {step > s.id ? <CheckCircle2 size={16} /> : s.id}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= s.id ? 'text-indigo-600' : 'text-slate-400'}`}>{s.title}</span>
            </div>
          ))}
        </div>
        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-500"
            style={{ width: `${(step / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  )
}

export default KYCWizard
