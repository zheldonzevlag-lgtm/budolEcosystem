'use client'

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema } from '@/lib/validations/productSchema';
import Stepper from '@/components/ui/wizard/Stepper';
import FormSection from '@/components/ui/wizard/FormSection';
import StickyFooter from '@/components/ui/wizard/StickyFooter';
import DragDropImageUpload from '@/components/store/add-product/DragDropImageUpload';
import DragDropVideoUpload from '@/components/store/add-product/DragDropVideoUpload';
import CategorySelector from '@/components/store/add-product/CategorySelector';
import VariationMatrixManager from '@/components/admin/VariationMatrixManager';
import DraftListModal from '@/components/store/add-product/DraftListModal';
import dynamic from 'next/dynamic';
const CKEditorCustom = dynamic(() => import('@/components/CKEditorCustom'), { ssr: false });
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { uploadImage, uploadVideo } from '@/lib/uploadUtils';
import * as draftStore from '@/lib/draftStore';
import { initializeUploadQueue, getQueueStatus, subscribeToQueue } from '@/lib/uploadQueue';

// Icons
import { Package, Truck, Layers, Info, Wand2, Loader2, ChevronDown, ChevronUp, Image, Video, FileText, Save, CloudOff, CheckCircle, Wifi, WifiOff, RefreshCw, FileStack } from 'lucide-react';

const STEPS = [
    { label: 'Basic Info', icon: Info },
    { label: 'Sales Info', icon: Layers },
    { label: 'Shipping', icon: Truck },
    { label: 'Others', icon: Package },
];

// Helper to normalize images to object format with IDs
const normalizeMedia = (media) => {
    return (media || []).map(img => {
        if (typeof img === 'string') {
            return {
                id: `img-${Math.random().toString(36).substr(2, 9)}`,
                url: img
            };
        } else if (typeof img === 'object' && img !== null) {
            // Ensure object has an ID
            if (!img.id) {
                return { ...img, id: `img-${Math.random().toString(36).substr(2, 9)}` };
            }
            return img;
        }
        return img;
    });
};

export default function AddProductWizard({ initialData, storeId }) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [maxImages, setMaxImages] = useState(12);
    const [maxVideos, setMaxVideos] = useState(0);
    const [imagesExpanded, setImagesExpanded] = useState(true);
    const [videosExpanded, setVideosExpanded] = useState(false);
    const [descriptionExpanded, setDescriptionExpanded] = useState(false);


    useEffect(() => {
        fetch('/api/system/settings')
            .then(res => res.json())
            .then(data => {
                if (Number.isFinite(data.maxProductImages)) setMaxImages(data.maxProductImages);
                if (Number.isFinite(data.maxProductVideos)) setMaxVideos(data.maxProductVideos);
            })
            .catch(err => console.error('Failed to load settings:', err));
    }, []);

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
        trigger,
        watch,
        setValue,
        getValues,
        reset
    } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: initialData || {
            name: '',
            description: '',
            categoryId: null,
            price: 0,
            mrp: 0,
            stock: 0,
            weight: 0,
            length: 0,
            width: 0,
            height: 0,
            condition: 'New',
            preOrder: false,
            images: [],
            videos: [],
            hasVariations: false,
            variation_matrix: [],
            tier_variations: [],
            parent_sku: '',
            hidden_combos: []
        },
        mode: 'onChange'
    });

    // Synchronize form with initialData when it arrives (essential for async loading)
    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

    const hasVariations = watch('hasVariations');

    const handleStepClick = async (targetStep) => {
        if (targetStep < currentStep) {
            // Always allow going back
            setCurrentStep(targetStep);
            window.scrollTo(0, 0);
            return;
        }

        // To jump ahead to targetStep, we must validate intermediate steps
        let allValid = true;
        for (let i = currentStep; i < targetStep; i++) {
            const stepValid = await trigger(getFieldsForStep(i));
            if (!stepValid) {
                allValid = false;
                setCurrentStep(i); // Stop at the first step with errors
                toast.error(`Please fix errors in ${STEPS[i].label} first.`);
                break;
            }
        }

        if (allValid) {
            setCurrentStep(targetStep);
            window.scrollTo(0, 0);
        }
    };

    const handleNext = async () => {
        const fieldsToValidate = getFieldsForStep(currentStep);
        const isValid = await trigger(fieldsToValidate);

        if (isValid) {
            setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
            window.scrollTo(0, 0);
        } else {
            // Find first error and scroll to it
            const firstErrorField = fieldsToValidate.find(field => errors[field]);
            if (firstErrorField) {
                const element = document.getElementsByName(firstErrorField)[0] || document.getElementById(firstErrorField);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            toast.error("Please fix the validation errors before proceeding.");
        }
    };

    const handlePrev = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
        window.scrollTo(0, 0);
    };

    const getFieldsForStep = (step) => {
        switch (step) {
            case 0: return ['name', 'categoryId', 'description'];
            case 1: return ['price', 'stock', 'mrp', 'hasVariations', 'variation_matrix'];
            case 2: return ['weight', 'length', 'width', 'height'];
            case 3: return ['condition', 'preOrder'];
            default: return [];
        }
    };

    const [isGenerating, setIsGenerating] = useState(false);

    const generateDescription = async () => {
        const name = watch('name');
        const categoryId = watch('categoryId');

        if (!name || !categoryId) {
            toast.error("Please enter a Product Name and select a Category first.");
            return;
        }

        setIsGenerating(true);
        try {
            const res = await fetch('/api/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, categoryId })
            });

            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
                setIsGenerating(false);
                return;
            }

            setValue('description', data.description, { shouldValidate: true });
            toast.success("Description generated magically! ✨");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate description.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!storeId) {
            toast.error('Store not found. Please refresh and try again.');
            return;
        }
        
        setIsSaving(true);
        try {
            const data = getValues();
            // Save as new draft (generates new ID)
            const newDraftId = await draftStore.saveDraft(storeId, data, null);
            if (newDraftId) {
                setCurrentDraftId(newDraftId);
                toast.success('Draft saved successfully!');
                // Refresh drafts list
                loadDraftsList();
            } else {
                toast.error('Failed to save draft');
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            toast.error('Failed to save draft');
        } finally {
            setIsSaving(false);
        }
    };
    
    // Load drafts list
    const loadDraftsList = async () => {
        if (!storeId) return;
        setIsLoadingDrafts(true);
        try {
            const drafts = await draftStore.getAllDrafts(storeId);
            setDraftsList(drafts);
        } catch (error) {
            console.error('Error loading drafts:', error);
        } finally {
            setIsLoadingDrafts(false);
        }
    };
    
    // Handle selecting a draft
    const handleSelectDraft = async (draftId) => {
        console.log('[DraftListModal] handleSelectDraft called with draftId:', draftId);
        try {
            const draft = await draftStore.getDraft(draftId);
            console.log('[DraftListModal] Draft retrieved:', draft);
            if (draft) {
                // Restore form data from draft
                Object.keys(draft).forEach(key => {
                    if (key !== 'id' && key !== 'storeId') {
                        setValue(key, draft[key]);
                    }
                });
                setCurrentDraftId(draftId);
                console.log('[DraftListModal] About to close modal');
                setShowDraftListModal(false);
                console.log('[DraftListModal] Modal should be closed now');
                toast.success('Draft loaded successfully!');
            } else {
                console.log('[DraftListModal] Draft not found!');
            }
        } catch (error) {
            console.error('[DraftListModal] Error loading draft:', error);
            toast.error('Failed to load draft');
        }
    };
    
    // Handle deleting a draft
    const handleDeleteDraft = async (draftId) => {
        try {
            await draftStore.deleteDraft(draftId);
            // Refresh list
            loadDraftsList();
            // If deleted current draft, clear it
            if (currentDraftId === draftId) {
                setCurrentDraftId(null);
            }
        } catch (error) {
            console.error('Error deleting draft:', error);
            toast.error('Failed to delete draft');
        }
    };

    const [draftAvailable, setDraftAvailable] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
    const [lastSaved, setLastSaved] = useState(null);
    const autoSaveTimerRef = useRef(null);
    
    // Multi-draft support
    const [currentDraftId, setCurrentDraftId] = useState(null);
    const [draftsList, setDraftsList] = useState([]);
    const [showDraftListModal, setShowDraftListModal] = useState(false);
    const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
    
    // Online/Offline status for crash protection and offline-ready
    const [isOnline, setIsOnline] = useState(true);
    const [uploadQueueStatus, setUploadQueueStatus] = useState({ pendingCount: 0, failedCount: 0 });
    const [hasIncompleteUploads, setHasIncompleteUploads] = useState(false);

    // Initialize upload queue and online/offline listeners
    useEffect(() => {
        // Set initial online status
        setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
        
        // Initialize upload queue
        const cleanup = initializeUploadQueue();
        
        // Subscribe to queue updates
        const unsubscribe = subscribeToQueue((status) => {
            setUploadQueueStatus({
                pendingCount: status.pendingCount,
                failedCount: status.failedCount
            });
            setIsOnline(status.isOnline);
        });
        
        // Listen for online/offline events
        const handleOnline = () => {
            setIsOnline(true);
            toast.success("You're back online! Uploads will resume.", { id: 'online-status' });
        };
        const handleOffline = () => {
            setIsOnline(false);
            toast.error("You're offline. Progress is saved locally.", { id: 'online-status', duration: 4000 });
        };
        
        if (typeof window !== 'undefined') {
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
        }
        
        return () => {
            cleanup?.();
            unsubscribe?.();
            if (typeof window !== 'undefined') {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            }
        };
    }, []);

    // Check for draft on mount and load drafts list
    useEffect(() => {
        const checkDraft = async () => {
            // Load drafts list for "View Drafts" button
            if (storeId) {
                await loadDraftsList();
            }
        };
        checkDraft();
    }, [storeId]);

    const restoreDraft = async () => {
        try {
            const savedDraft = await draftStore.getDraft(storeId);
            console.log('[restoreDraft] Raw draft data:', {
                hasData: !!savedDraft,
                keys: savedDraft ? Object.keys(savedDraft) : [],
                variationMatrixLength: savedDraft?.variation_matrix?.length,
                hasVariationMatrix: !!savedDraft?.variation_matrix,
                hasTierVariations: !!savedDraft?.tier_variations,
                hasHiddenCombos: !!savedDraft?.hidden_combos
            });
            
            // Log each variant's image status
            if (savedDraft?.variation_matrix) {
                console.log('[restoreDraft] Variation matrix in draft:');
                savedDraft.variation_matrix.forEach((v, i) => {
                    console.log(`  Variant ${i}:`, { 
                        hasImage: !!v.image, 
                        imageType: typeof v.image,
                        imageUrl: v.image?.url,
                        imageFile: v.image?.file ? 'has file (base64)' : 'no file'
                    });
                });
            }
            
            if (savedDraft) {
                Object.keys(savedDraft).forEach(key => {
                    if (key === 'images' || key === 'videos') {
                        setValue(key, normalizeMedia(savedDraft[key]));
                    } else if (key === 'variation_matrix') {
                        console.log('[restoreDraft] Setting variation_matrix:', savedDraft[key]?.length, 'variants');
                        // Log each variant's image status
                        savedDraft[key]?.forEach((v, i) => {
                            console.log(`  Variant ${i}:`, { hasImage: !!v.image, imageType: typeof v.image, imageValue: v.image?.url || v.image });
                        });
                        setValue(key, savedDraft[key]);
                    } else if (key === 'hidden_combos') {
                        console.log('[restoreDraft] Setting hidden_combos:', savedDraft[key]);
                        setValue(key, savedDraft[key]);
                    } else {
                        setValue(key, savedDraft[key]);
                    }
                });
                toast.success("Draft restored successfully!");
                setDraftAvailable(false);
            }
        } catch (e) {
            console.error("Error restoring draft", e);
            toast.error("Failed to restore draft");
        }
    };

    // Auto-save draft with status tracking - optimized to avoid saving during uploads
    // Only auto-saves when there's an existing draft (currentDraftId), to prevent creating duplicate drafts
    useEffect(() => {
        if (!storeId) return;

        const performAutoSave = async () => {
            const data = getValues();
            // Check if form has any meaningful data
            const hasData = data.name || data.categoryId || (data.images || []).length > 0 || (data.videos || []).length > 0 || (data.variation_matrix || []).length > 0;
            
            // Skip if currently uploading (check if any images/videos are in uploading state)
            const isUploading = (data.images || []).some(img => img.uploading) || (data.videos || []).some(vid => vid.uploading);
            
            // Only auto-save if we have an existing draft to update
            // This prevents creating duplicate drafts on every auto-save
            if (hasData && !isUploading && currentDraftId) {
                setAutoSaveStatus('saving');
                try {
                    await draftStore.saveDraft(storeId, data, currentDraftId);
                    setAutoSaveStatus('saved');
                    setLastSaved(new Date());
                    console.log('[Auto-save] Draft saved to IndexedDB');
                    
                    // Reset status after 3 seconds
                    setTimeout(() => setAutoSaveStatus('idle'), 3000);
                } catch (error) {
                    console.error('[Auto-save] Failed to save:', error);
                    setAutoSaveStatus('error');
                    setTimeout(() => setAutoSaveStatus('idle'), 5000);
                }
            }
        };

        // Debounced auto-save - wait 3 seconds after last change
        const interval = setInterval(() => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
            autoSaveTimerRef.current = setTimeout(performAutoSave, 3000);
        }, 1000);

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
            clearInterval(interval);
        };
    }, [storeId, getValues]);

    const onSubmit = async (data) => {
        // Check if online - require internet for submission
        if (!isOnline) {
            toast.error("You're currently offline. Please connect to the internet to submit.");
            return;
        }
        
        setIsSaving(true);
        const toastId = toast.loading("Preparing product...");

        try {
            if (!storeId) {
                throw new Error("Store ID is missing. Please refresh and try again.");
            }

            // Check for any files that need uploading
            const pendingImages = (data.images || []).filter(img => img.file && !img.url?.startsWith('http'));
            const pendingVideos = (data.videos || []).filter(vid => vid.file && !vid.url?.startsWith('http'));
            const pendingVariants = (data.variation_matrix || []).filter(v => v.image?.file && !v.image?.url?.startsWith('http'));
            
            const totalPending = pendingImages.length + pendingVideos.length + pendingVariants.length;
            
            // Update toast to show upload progress
            if (totalPending > 0) {
                toast.loading(`Uploading ${totalPending} media file(s) to Cloudinary...`, { id: toastId });
            }

            // 1. Upload pending images - only upload files that haven't been uploaded yet
            const processedImages = await Promise.all(
                (data.images || []).map(async (img) => {
                    // If already has Cloudinary URL, use it
                    if (img.url && (img.url.startsWith('http') || img.url.startsWith('/'))) {
                        return img.url;
                    }
                    // If has a file object, upload it now
                    if (img.file) {
                        try {
                            const cloudinaryUrl = await uploadImage(img.file);
                            return cloudinaryUrl;
                        } catch (error) {
                            console.error('Failed to upload image:', error);
                            throw new Error(`Failed to upload image: ${img.fileName || 'unknown'}`);
                        }
                    }
                    // If it's a string but not a URL, try to use it
                    if (typeof img === 'string') {
                        return img;
                    }
                    return '';
                })
            );

            // 2. Upload pending videos
            const processedVideos = await Promise.all(
                (data.videos || []).map(async (video) => {
                    if (video.url && (video.url.startsWith('http') || video.url.startsWith('/'))) {
                        return video.url;
                    }
                    if (video.file) {
                        try {
                            const cloudinaryUrl = await uploadVideo(video.file);
                            return cloudinaryUrl;
                        } catch (error) {
                            console.error('Failed to upload video:', error);
                            throw new Error(`Failed to upload video: ${video.fileName || 'unknown'}`);
                        }
                    }
                    if (typeof video === 'string') {
                        return video;
                    }
                    return '';
                })
            );

            // 3. Upload pending variation images
            let processedVariations = [];
            if (data.hasVariations && data.variation_matrix?.length > 0) {
                processedVariations = await Promise.all(
                    data.variation_matrix.map(async (variant) => {
                        const image = variant.image;
                        // Handle both string URLs (from database) and object format (from user upload)
                        // Database stores: "https://res.cloudinary.com/abc.jpg"
                        // User upload stores: { url: "blob:...", file: File }
                        let imageUrl = typeof image === 'string' ? image : image?.url;
                        
                        // If already has Cloudinary URL, use it (prevents re-upload and preserves existing images)
                        if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/'))) {
                            return { ...variant, image: imageUrl };
                        }
                        
                        // If has a file object (direct from user selection), upload it now
                        if (image?.file && image.file instanceof File) {
                            try {
                                imageUrl = await uploadImage(image.file);
                                return { ...variant, image: imageUrl };
                            } catch (error) {
                                console.error('Failed to upload variant image:', error);
                                throw new Error(`Failed to upload variant image`);
                            }
                        }
                        
                        // If has a blob URL (local preview), we can't upload it directly
                        // It needs to be converted to a File first
                        if (imageUrl && imageUrl.startsWith('blob:')) {
                            console.warn('Variant image has blob URL that cannot be uploaded directly:', imageUrl);
                            // Try to get from file data if available
                            if (image?.fileData) {
                                try {
                                    // Convert base64 to blob then to File
                                    const response = await fetch(image.fileData);
                                    const blob = await response.blob();
                                    const file = new File([blob], image.fileName || 'variant-image.jpg', { type: image.fileType || 'image/jpeg' });
                                    imageUrl = await uploadImage(file);
                                    return { ...variant, image: imageUrl };
                                } catch (err) {
                                    console.error('Failed to convert and upload variant image:', err);
                                }
                            }
                            // If we can't upload, keep the blob URL (won't work on server)
                            return { ...variant, image: imageUrl };
                        }
                        
                        // Preserve existing image URL if it exists, otherwise set to null
                        return { ...variant, image: imageUrl || null };
                    })
                );
            }

            // 3. Prepare Payload
            const payload = {
                ...data,
                storeId,
                images: processedImages,
                videos: processedVideos,
                variation_matrix: processedVariations,
                // Ensure numeric values are numbers
                price: parseFloat(data.price || 0),
                mrp: parseFloat(data.mrp || 0),
                stock: parseInt(data.stock || 0),
                weight: parseFloat(data.weight || 0),
                length: parseFloat(data.length || 0),
                width: parseFloat(data.width || 0),
                height: parseFloat(data.height || 0),
            };

            // Fix for "Price must be greater than 0" when hasVariations is true
            // If the product has variations, the base price is the minimum price of all variations
            if (data.hasVariations && processedVariations.length > 0) {
                const minPrice = Math.min(...processedVariations.map(v => parseFloat(v.price || 0)));
                payload.price = minPrice > 0 ? minPrice : payload.price;
            }

            // 4. Send to API
            const isEdit = !!initialData?.id;
            const url = isEdit ? `/api/products/${initialData.id}` : '/api/products';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save product');
            }

            toast.success(isEdit ? "Product updated successfully!" : "Product created successfully!", { id: toastId });

            // Clean up draft after successful save (both new and existing products)
            await draftStore.deleteDraft(storeId);

            // Redirect to products list
            router.push('/store/manage-product');

        } catch (error) {
            console.error("Submission error:", error);
            toast.error(error.message || "Something went wrong", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const onInvalid = (errors) => {
        console.error("Validation Errors:", errors);
        const firstError = Object.values(errors)[0];
        if (firstError?.message) {
            toast.error(`Validation Error: ${firstError.message}`);
        } else {
            toast.error("Please check all steps for missing or incorrect information.");
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-24">
            {draftAvailable && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                            <Info size={20} />
                        </div>
                        <div>
                            <h3 className="font-medium text-blue-900">Unsaved Draft Found</h3>
                            <p className="text-sm text-blue-700">You have a previously unsaved product draft.</p>
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            restoreDraft();
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                        Restore Draft
                    </button>
                </div>
            )}

            {/* Auto-save Status Indicator */}
            {autoSaveStatus !== 'idle' && (
                <div className={`mb-4 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium animate-in fade-in ${
                    autoSaveStatus === 'saving' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                    autoSaveStatus === 'saved' ? 'bg-green-50 text-green-800 border border-green-200' :
                    autoSaveStatus === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'hidden'
                }`}>
                    {autoSaveStatus === 'saving' && (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving locally...</span>
                        </>
                    )}
                    {autoSaveStatus === 'saved' && (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Saved locally {lastSaved && `at ${lastSaved.toLocaleTimeString()}`}</span>
                        </>
                    )}
                    {autoSaveStatus === 'error' && (
                        <>
                            <CloudOff className="w-4 h-4" />
                            <span>Failed to save. Your work may be lost on refresh.</span>
                        </>
                    )}
                </div>
            )}

            {/* View Drafts Button */}
            {storeId && (
                <div className="mb-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setShowDraftListModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        <FileStack className="w-4 h-4" />
                        <span>View Drafts {draftsList.length > 0 ? `(${draftsList.length})` : ''}</span>
                    </button>
                </div>
            )}

            {/* Draft List Modal */}
            <DraftListModal
                isOpen={showDraftListModal}
                onClose={() => setShowDraftListModal(false)}
                drafts={draftsList}
                onSelectDraft={handleSelectDraft}
                onDeleteDraft={handleDeleteDraft}
                isLoading={isLoadingDrafts}
            />

            {/* Online/Offline Status Indicator */}
            {(
                <div className={`mb-4 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium animate-in fade-in ${
                    isOnline ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-orange-50 text-orange-800 border border-orange-200'
                }`}>
                    {isOnline ? (
                        <>
                            <Wifi className="w-4 h-4" />
                            <span>Online - {uploadQueueStatus.pendingCount > 0 ? `${uploadQueueStatus.pendingCount} uploads pending` : 'All uploads complete'}</span>
                            {uploadQueueStatus.failedCount > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                                    {uploadQueueStatus.failedCount} failed
                                </span>
                            )}
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-4 h-4" />
                            <span>Offline - Progress saved locally. Uploads will resume when online.</span>
                        </>
                    )}
                </div>
            )}

            {/* Incomplete Uploads Recovery Banner */}
            {hasIncompleteUploads && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                            <RefreshCw size={20} />
                        </div>
                        <div>
                            <h3 className="font-medium text-amber-900">Incomplete Uploads Found</h3>
                            <p className="text-sm text-amber-700">Some media failed to upload previously. Please retry or remove them.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setHasIncompleteUploads(false)}
                        className="px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <Stepper
                steps={STEPS.map((step, idx) => ({
                    ...step,
                    hasError: getFieldsForStep(idx).some(field => !!errors[field])
                }))}
                currentStep={currentStep}
                setCurrentStep={handleStepClick}
                isDisabled={isSaving}
            />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                {/* Step 1: Basic Info */}
                {currentStep === 0 && (
                    <FormSection isActive={currentStep === 0}>
                        <h2 className="text-xl font-bold mb-6 text-slate-800">Basic Information</h2>

                        <fieldset disabled={isSaving} className="grid gap-6 disabled:opacity-90">
                            {/* Product Images */}
                            {/* Collapsible Product Images Section */}
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => !isSaving && setImagesExpanded(!imagesExpanded)}
                                    disabled={isSaving}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-2">
                                        <Image className="w-5 h-5 text-slate-600" />
                                        <span className="font-medium text-slate-700">Product Images</span>
                                        {(!watch('hasVariations') || !(watch('variation_matrix') || []).some(v => !!v?.image)) && (
                                            <span className="text-red-500">*</span>
                                        )}
                                    </div>
                                    <span className="flex-1 text-center text-xs text-blue-600">
                                        Add images that are different from the variant images if the product have variance.
                                    </span>
                                    {imagesExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-slate-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                    )}
                                </button>

                                {imagesExpanded && (
                                    <div className="p-4">
                                        <Controller
                                            control={control}
                                            name="images"
                                            render={({ field: { value, onChange } }) => (
                                                <DragDropImageUpload
                                                    images={value}
                                                    onChange={onChange}
                                                    maxImages={maxImages}
                                                />
                                            )}
                                        />
                                        {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images.message}</p>}
                                        <p className="text-xs text-slate-400">
                                            Supported formats: JPG, PNG, WEBP. Max size: 5MB per image. Drag to reorder.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Collapsible Product Videos Section */}
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => !isSaving && setVideosExpanded(!videosExpanded)}
                                    disabled={isSaving}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-2">
                                        <Video className="w-5 h-5 text-slate-600" />
                                        <span className="font-medium text-slate-700">Product Videos</span>
                                    </div>
                                    {videosExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-slate-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                    )}
                                </button>

                                {videosExpanded && (
                                    <div className="p-4">
                                        {maxVideos > 0 ? (
                                            <Controller
                                                control={control}
                                                name="videos"
                                                render={({ field: { value, onChange } }) => (
                                                    <DragDropVideoUpload
                                                        videos={value}
                                                        onChange={onChange}
                                                        maxVideos={maxVideos}
                                                    />
                                                )}
                                            />
                                        ) : (
                                            <div className="text-xs text-slate-400">Video uploads are disabled in Product Settings.</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Product Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Product Name <span className="text-red-500">*</span></label>
                                <input
                                    id="name"
                                    {...register('name')}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all ${errors.name ? 'border-red-500 ring-red-100 ring-2' : 'border-slate-300 focus:ring-blue-500'}`}
                                    placeholder="Ex: Nike Air Max 90"
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1 animate-pulse font-medium">⚠️ {errors.name.message}</p>}
                                <div className="flex justify-end mt-1 text-xs text-slate-400">
                                    {watch('name')?.length || 0}/120
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category <span className="text-red-500">*</span></label>
                                <Controller
                                    name="categoryId"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <CategorySelector
                                            value={field.value}
                                            onChange={field.onChange}
                                            error={fieldState.error?.message}
                                            fallbackName={watch('category')}
                                        />
                                    )}
                                />
                            </div>

                            {/* Description - Collapsible */}
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => !isSaving && setDescriptionExpanded(!descriptionExpanded)}
                                    disabled={isSaving}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-slate-600" />
                                        <span className="font-medium text-slate-700">Description</span>
                                        <span className="text-red-500">*</span>
                                    </div>
                                    {descriptionExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-slate-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                    )}
                                </button>

                                {descriptionExpanded && (
                                    <div className="p-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <button
                                                type="button"
                                                onClick={generateDescription}
                                                disabled={isGenerating || isSaving}
                                                className="text-xs flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:shadow-md transition-all disabled:opacity-50"
                                            >
                                                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                                {isGenerating ? "Magic Writing..." : "Magic Write"}
                                            </button>
                                        </div>
                                        <Controller
                                            name="description"
                                            control={control}
                                            render={({ field: { value, onChange } }) => (
                                                <div className={`prose max-w-none border rounded-lg overflow-hidden transition-all ${errors.description ? 'border-red-500 ring-2 ring-red-50' : 'border-slate-200'}`}>
                                                    <CKEditorCustom value={value} onChange={onChange} placeholder="Product description..." />
                                                </div>
                                            )}
                                        />
                                        {errors.description && <p className="text-red-500 text-xs mt-1 animate-pulse font-medium">⚠️ {errors.description.message}</p>}
                                    </div>
                                )}
                            </div>
                        </fieldset>
                    </FormSection>
                )}

                {/* Step 2: Sales Info */}
                {currentStep === 1 && (
                    <FormSection isActive={currentStep === 1}>
                        <h2 className="text-xl font-bold mb-6 text-slate-800">Sales Information</h2>

                        <fieldset disabled={isSaving} className="disabled:opacity-90">
                            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        {...register('hasVariations')}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <div>
                                        <span className="font-medium text-slate-700">Enable Variations</span>
                                        <p className="text-sm text-slate-500">Enable this if your product has options like size, color, etc.</p>
                                    </div>
                                </label>
                            </div>

                            {hasVariations ? (
                                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                    <Controller
                                        name="variation_matrix"
                                        control={control}
                                        render={({ field: { value, onChange } }) => {
                                            // Debug: Log variation_matrix changes
                                            console.log('[AddProductWizard] variation_matrix changed:', {
                                                type: typeof value,
                                                length: value?.length,
                                                sample: value?.slice(0, 2)
                                            });
                                            return (
                                                <VariationMatrixManager
                                                    errors={errors.variation_matrix}
                                                    initialData={{
                                                        tier_variations: watch('tier_variations'),
                                                        variation_matrix: value,
                                                        parent_sku: watch('parent_sku'),
                                                        hidden_combos: watch('hidden_combos')
                                                    }}
                                                    onUpdate={(data) => {
                                                        setValue('tier_variations', data.tier_variations);
                                                        setValue('variation_matrix', data.variation_matrix);
                                                        setValue('parent_sku', data.parent_sku);
                                                        setValue('hidden_combos', data.hidden_combos);
                                                    }}
                                                />
                                            );
                                        }}
                                    />
                                    {errors.variation_matrix && (
                                        <p className="text-red-500 text-xs mt-3 animate-pulse font-medium bg-red-50 p-2 rounded border border-red-100">
                                            ⚠️ {errors.variation_matrix.message}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Price <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-slate-400">₱</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                {...register('price')}
                                                className={`w-full pl-8 px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all ${errors.price ? 'border-red-500 ring-red-100 ring-2' : 'border-slate-300 focus:ring-blue-500'}`}
                                            />
                                        </div>
                                        {errors.price && <p className="text-red-500 text-xs mt-1 animate-pulse font-medium">⚠️ {errors.price.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">MRP (Original Price)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-slate-400">₱</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                {...register('mrp')}
                                                className={`w-full pl-8 px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all ${errors.mrp ? 'border-red-500 ring-red-100 ring-2' : 'border-slate-300 focus:ring-blue-500'}`}
                                            />
                                        </div>
                                        {errors.mrp && <p className="text-red-500 text-xs mt-1 animate-pulse font-medium">⚠️ {errors.mrp.message}</p>}
                                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">Optional: Strike-through price</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Stock <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            {...register('stock')}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all ${errors.stock ? 'border-red-500 ring-red-100 ring-2' : 'border-slate-300 focus:ring-blue-500'}`}
                                        />
                                        {errors.stock && <p className="text-red-500 text-xs mt-1 animate-pulse font-medium">⚠️ {errors.stock.message}</p>}
                                    </div>
                                </div>
                            )}
                        </fieldset>
                    </FormSection>
                )}

                {/* Step 3: Shipping */}
                {currentStep === 2 && (
                    <FormSection isActive={currentStep === 2}>
                        <h2 className="text-xl font-bold mb-6 text-slate-800">Shipping Information</h2>

                        <fieldset disabled={isSaving} className="grid grid-cols-1 md:grid-cols-2 gap-6 disabled:opacity-90">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg) <span className="text-red-500">*</span></label>
                                <input
                                    type="number" step="0.01"
                                    {...register('weight')}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all ${errors.weight ? 'border-red-500 ring-red-100 ring-2' : 'border-slate-300 focus:ring-blue-500'}`}
                                    placeholder="0.5"
                                />
                                {errors.weight && <p className="text-red-500 text-xs mt-1 animate-pulse font-medium">⚠️ {errors.weight.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Length (cm)</label>
                                <input
                                    type="number" step="1"
                                    {...register('length')}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="10"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Width (cm)</label>
                                <input
                                    type="number" step="1"
                                    {...register('width')}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="10"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
                                <input
                                    type="number" step="1"
                                    {...register('height')}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="10"
                                />
                            </div>
                        </fieldset>
                    </FormSection>
                )}

                {/* Step 4: Others */}
                {currentStep === 3 && (
                    <FormSection isActive={currentStep === 3}>
                        <h2 className="text-xl font-bold mb-6 text-slate-800">Other Information</h2>

                        <fieldset disabled={isSaving} className="grid gap-6 disabled:opacity-90">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                                <select
                                    {...register('condition')}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="New">New</option>
                                    <option value="Used">Used</option>
                                    <option value="Refurbished">Refurbished</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <input
                                    type="checkbox"
                                    {...register('preOrder')}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <div>
                                    <span className="font-medium text-slate-700">Pre-Order</span>
                                    <p className="text-sm text-slate-500">Check this if the item is available for pre-order.</p>
                                </div>
                            </div>
                        </fieldset>
                    </FormSection>
                )}
            </form>

            <StickyFooter
                isFirstStep={currentStep === 0}
                isLastStep={currentStep === STEPS.length - 1}
                onNext={currentStep === STEPS.length - 1 ? handleSubmit(onSubmit, onInvalid) : handleNext}
                onPrev={handlePrev}
                isSaving={isSaving}
                onSaveDraft={handleSaveDraft}
            />
        </div>
    );
}
