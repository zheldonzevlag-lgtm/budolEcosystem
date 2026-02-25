'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XIcon, UploadIcon, InfoIcon, ShieldCheckIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import BudolPayText from '../payment/BudolPayText';

export default function ReturnRequestModal({ order, onClose, onSuccess }) {
    const [reason, setReason] = useState('');
    const [type, setType] = useState('REFUND_ONLY');
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const reasons = [
        "Did not receive the order",
        "Received an incomplete product",
        "Received the wrong product",
        "Received a product with physical damage",
        "Received a faulty product",
        "Change of mind (BudolShap Mall orders only)"
    ];

    const handleImageChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length + previews.length > 5) {
            toast.error("Maximum 5 photos allowed");
            return;
        }

        setIsUploading(true);
        const newPreviews = [...previews];
        const newImages = [...images];

        try {
            for (const file of files) {
                if (file.size > 5 * 1024 * 1024) {
                    toast.error(`${file.name} is too large (>5MB)`);
                    continue;
                }

                // Read for preview
                const reader = new FileReader();
                const previewPromise = new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result);
                });
                reader.readAsDataURL(file);
                const base64Image = await previewPromise;

                // Upload to Cloudinary
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64Image })
                });

                if (!res.ok) throw new Error("Upload failed");
                const data = await res.json();

                newPreviews.push(data.url);
                newImages.push(data.url);
            }
            setPreviews(newPreviews);
            setImages(newImages);
        } catch (error) {
            toast.error("Failed to upload some images");
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = (index) => {
        setPreviews(previews.filter((_, i) => i !== index));
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) {
            toast.error("Please select a reason");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/orders/${order.id}/return`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason,
                    type,
                    refundAmount: order.total,
                    images: images
                })
            });

            if (response.ok) {
                toast.success("Return request submitted successfully");
                onSuccess();
                onClose();
            } else {
                const data = await response.json();
                throw new Error(data.error || "Failed to submit request");
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Request Return / Refund</h3>
                        <p className="text-xs text-slate-500">Order #<BudolPayText text={order.id} /></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <XIcon size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
                    {/* BudolShap Guarantee Banner */}
                    <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg flex gap-3 text-sm text-orange-800">
                        <ShieldCheckIcon className="text-orange-500 flex-shrink-0" size={20} />
                        <div>
                            <span className="font-bold whitespace-nowrap"><BudolPayText text="budolShap" /><span className="text-orange-600"> Guarantee</span></span>
                            <p className="text-xs opacity-90">Your funds are held safely until you confirm receipt or the protection window ends.</p>
                        </div>
                    </div>

                    {/* Return Type */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">What do you need?</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setType('REFUND_ONLY')}
                                className={`p-4 border rounded-xl text-left transition-all hover:border-green-400 ${type === 'REFUND_ONLY' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-slate-200'}`}
                            >
                                <div className="font-bold text-sm text-green-700">Refund Only</div>
                                <div className="text-[10px] text-slate-500 mt-1">I didn't receive the item or it's missing parts. (No return needed)</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('RETURN_AND_REFUND')}
                                className={`p-4 border rounded-xl text-left transition-all hover:border-green-400 ${type === 'RETURN_AND_REFUND' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-slate-200'}`}
                            >
                                <div className="font-bold text-sm text-green-700">Return Item</div>
                                <div className="text-[10px] text-slate-500 mt-1">Item is damaged, wrong, or faulty. (Must ship back to seller)</div>
                            </button>
                        </div>
                    </div>

                    {/* Reason Select */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Reason</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500 transition-colors text-sm"
                            required
                        >
                            <option value="">Select a reason</option>
                            {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    {/* Evidence Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Add Evidence (Photos) {previews.length > 0 && `(${previews.length}/5)`}</label>

                        {/* Image Previews */}
                        {previews.length > 0 && (
                            <div className="grid grid-cols-5 gap-2 mb-2">
                                {previews.map((src, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                                        <img src={src} alt="Evidence" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
                                        >
                                            <XIcon size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div
                            onClick={() => !isUploading && document.getElementById('return-evidence-upload').click()}
                            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer group
                                ${isUploading ? 'border-slate-100 bg-slate-50 cursor-wait' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
                        >
                            {isUploading ? (
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 border-4 border-slate-200 border-t-green-500 rounded-full animate-spin mb-2" />
                                    <span className="text-xs text-slate-500">Uploading...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform mb-2">
                                        <UploadIcon size={24} className="text-slate-400" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-600">Drag and drop or click to upload</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Maximum 5 photos, 5MB each</p>
                                </>
                            )}
                            <input
                                id="return-evidence-upload"
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                                disabled={isUploading}
                            />
                        </div>
                    </div>

                    {/* Refund Amount */}
                    <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center">
                        <div className="text-sm text-slate-600 font-medium">Refund Amount</div>
                        <div className="text-lg font-bold text-green-600">₱{order.total.toLocaleString()}</div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-slate-800 text-white p-4 rounded-xl font-bold hover:bg-slate-900 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? "Submitting Request..." : "Submit Request"}
                    </button>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
