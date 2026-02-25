'use client';

import { useState } from 'react';
import { CameraIcon, CheckCircleIcon, UploadIcon, XCircleIcon, InfoIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PaymentProofUpload({ order, onUploaded }) {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [refNumber, setRefNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [uploading, setUploading] = useState(false);
    const [submitted, setSubmitted] = useState(!!order.paymentProof);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB');
                return;
            }
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!preview) {
            toast.error('Please select an image of your receipt');
            return;
        }

        setUploading(true);
        try {
            // 1. Upload to Cloudinary via our API
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: preview })
            });

            if (!uploadRes.ok) throw new Error('Failed to upload image');
            const { url } = await uploadRes.json();

            // 2. Submit payment proof to order
            const proofRes = await fetch(`/api/orders/${order.id}/payment-proof`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: url,
                    refNumber,
                    notes
                })
            });

            if (!proofRes.ok) {
                const error = await proofRes.json();
                throw new Error(error.message || 'Failed to submit proof');
            }

            toast.success('Payment proof submitted successfully!');
            setSubmitted(true);
            if (onUploaded) onUploaded();
        } catch (error) {
            console.error('Submission error:', error);
            toast.error(error.message || 'Something went wrong. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-green-800 mb-2">Payment Proof Submitted</h3>
                <p className="text-sm text-green-700 mb-4 px-4">
                    We have received your payment proof. Our team will verify it within 24 hours. Your order status will be updated once confirmed.
                </p>
                {order.paymentProof && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-green-100 inline-block">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Reference Number</p>
                        <p className="font-mono font-bold text-slate-700">{order.paymentProof.refNumber || 'N/A'}</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
            <div
                className="bg-primary/5 p-4 border-b border-slate-100 flex items-center gap-3 cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="bg-primary/10 p-2 rounded-lg">
                    <UploadIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-slate-800">Upload Payment Proof</h3>
                    <p className="text-xs text-slate-500">Required for QRPH & Bank Transfer verification</p>
                </div>
                <button
                    type="button"
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                >
                    {isExpanded ? (
                        <ChevronUpIcon className="w-5 h-5 text-slate-600" />
                    ) : (
                        <ChevronDownIcon className="w-5 h-5 text-slate-600" />
                    )}
                </button>
            </div>

            {isExpanded && (
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left: Image Selection */}
                        <div className="space-y-4">
                            <div
                                className={`
                                    relative aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all
                                    ${preview ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'}
                                `}
                                onClick={() => document.getElementById('receipt-upload').click()}
                            >
                                {preview ? (
                                    <img src={preview} alt="Receipt preview" className="absolute inset-0 w-full h-full object-contain p-2" />
                                ) : (
                                    <>
                                        <CameraIcon className="w-12 h-12 text-slate-300 mb-2" />
                                        <p className="text-sm text-slate-500 font-medium">Click to select receipt</p>
                                        <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                                    </>
                                )}
                                {preview && !uploading && (
                                    <button
                                        type="button"
                                        className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full p-1.5 shadow-sm text-red-500 hover:bg-red-50 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPreview(null);
                                            setImage(null);
                                        }}
                                    >
                                        <XCircleIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            <input
                                id="receipt-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                                disabled={uploading}
                            />
                        </div>

                        {/* Right: Details */}
                        <div className="flex flex-col">
                            <div className="space-y-4 flex-1">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                        Reference Number
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. GCash Ref No., Bank Ref"
                                        value={refNumber}
                                        onChange={(e) => setRefNumber(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                        disabled={uploading}
                                    />
                                    <p className="mt-1.5 text-[11px] text-slate-400">Optional but highly recommended for faster verification</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                        Additional Notes
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Any additional info for verification..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 resize-none"
                                        disabled={uploading}
                                    />
                                </div>

                                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex gap-3">
                                    <InfoIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                        Please ensure your receipt clearly shows the <strong>Amount</strong>, <strong>Date</strong>, and <strong>Transaction ID</strong>.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || !preview}
                                className={`
                                    mt-6 w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-[0.98]
                                    ${uploading || !preview
                                        ? 'bg-slate-300 cursor-not-allowed'
                                        : 'bg-primary hover:bg-primary-dark shadow-lg shadow-primary/20'}
                                `}
                            >
                                {uploading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting proof...
                                    </div>
                                ) : (
                                    'Submit Payment Proof'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}
