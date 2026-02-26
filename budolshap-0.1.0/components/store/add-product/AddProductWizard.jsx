'use client'

import { useState, useEffect } from 'react';
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
import dynamic from 'next/dynamic';
const CKEditorCustom = dynamic(() => import('@/components/CKEditorCustom'), { ssr: false });
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { compressImage } from '@/lib/imageUtils';

// Icons
import { Package, Truck, Layers, Info, Wand2, Loader2, ChevronDown, ChevronUp, Image, Video, FileText } from 'lucide-react';

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
            case 0: return ['name', 'categoryId', 'description', 'images'];
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

    const uploadImage = async (input) => {
        let fileOrString = input;
        let id = null;

        // Handle object format { id, url } from DragDropImageUpload
        if (typeof input === 'object' && input !== null && !(input instanceof File)) {
            fileOrString = input.url || input.src;
            id = input.id;
        }

        // If it's already a URL (from existing product), return it
        if (typeof fileOrString === 'string' && (fileOrString.startsWith('http') || fileOrString.startsWith('/'))) {
            return input; // Return original input to preserve structure/ID
        }

        // If it's a base64 string or File object, we need to upload
        let base64Data = fileOrString;

        // If it's a File object, compress it first
        if (typeof fileOrString !== 'string' && fileOrString instanceof File) {
            try {
                base64Data = await compressImage(fileOrString);
            } catch (error) {
                console.error("Compression failed", error);
                // If compression fails, try to read as data URL directly
                base64Data = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(fileOrString);
                });
            }
        }

        // Upload to Cloudinary via our API
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Data })
            });

            if (!response.ok) {
                let errorMessage = 'Upload failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = `Server error (${response.status}): ${response.statusText || 'Unable to process upload'}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            // If we have an ID, return object structure, otherwise just URL
            if (id) {
                return { id, url: data.url };
            }
            return data.url;
        } catch (error) {
            console.error("Upload failed:", error);
            // DO NOT fallback to base64 as it causes ECONNRESET due to large payload size
            throw new Error(`Failed to upload one or more images: ${error.message}`);
        }
    };

    const uploadVideo = async (input) => {
        let fileOrString = input;
        let id = null;

        if (typeof input === 'object' && input !== null && !(input instanceof File)) {
            fileOrString = input.url || input.src;
            id = input.id;
        }

        if (typeof fileOrString === 'string' && (fileOrString.startsWith('http') || fileOrString.startsWith('/'))) {
            return input;
        }

        let base64Data = fileOrString;
        if (typeof fileOrString !== 'string' && fileOrString instanceof File) {
            base64Data = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(fileOrString);
            });
        }

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Data, type: 'video' })
            });

            if (!response.ok) {
                let errorMessage = 'Upload failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // Fallback for non-JSON errors (like server timeouts)
                    errorMessage = `Server error (${response.status}): ${response.statusText || 'Unable to process upload'}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (id) {
                return { id, url: data.url };
            }
            return data.url;
        } catch (error) {
            console.error("Video upload failed:", error);
            throw new Error(`Failed to upload video: ${error.message}`);
        }
    };

    const handleSaveDraft = () => {
        const data = getValues();

        // Helper to strip base64 from media arrays to prevent QuotaExceededError (5MB limit)
        const cleanMedia = (media) => (media || []).map(item => {
            if (typeof item === 'string') {
                return item.startsWith('data:') ? null : item;
            }
            if (item && typeof item === 'object' && item.url) {
                return item.url && item.url.startsWith('data:') ? { ...item, url: null } : item;
            }
            return item;
        }).filter(item => typeof item === 'string' ? !!item : !!item.url);

        const sanitizedData = {
            ...data,
            images: cleanMedia(data.images),
            videos: cleanMedia(data.videos),
            // Also clean variation images
            variation_matrix: (data.variation_matrix || []).map(v => ({
                ...v,
                image: (typeof v.image === 'string' && v.image.startsWith('data:')) ? null : v.image
            }))
        };

        try {
            const draftKey = `budol-product-draft-${storeId}`;
            localStorage.setItem(draftKey, JSON.stringify(sanitizedData));
            toast.success("Progress saved! (Note: Images/Videos are not stored in local drafts)");
        } catch (error) {
            console.error("Failed to save draft", error);
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                toast.error("Draft too large to save. Try reducing description length.");
            } else {
                toast.error("Failed to save draft locally.");
            }
        }
    };

    const [draftAvailable, setDraftAvailable] = useState(false);

    // Check for draft on mount
    useEffect(() => {
        if (!initialData?.id && storeId) {
            const draftKey = `budol-product-draft-${storeId}`;
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                setDraftAvailable(true);
            }
        }
    }, [initialData, storeId]);

    const restoreDraft = () => {
        const draftKey = `budol-product-draft-${storeId}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                Object.keys(parsed).forEach(key => {
                    if (key === 'images') {
                        setValue(key, normalizeMedia(parsed[key]));
                    } else if (key === 'videos') {
                        setValue(key, normalizeMedia(parsed[key]));
                    } else {
                        setValue(key, parsed[key]);
                    }
                });
                toast.success("Draft restored successfully!");
                setDraftAvailable(false);
            } catch (e) {
                console.error("Error parsing draft", e);
                toast.error("Failed to restore draft");
            }
        }
    };

    const onSubmit = async (data) => {
        setIsSaving(true);
        const toastId = toast.loading("Saving product...");

        try {
            if (!storeId) {
                throw new Error("Store ID is missing. Please refresh and try again.");
            }

            // 1. Upload Main Images
            const processedImages = await Promise.all(
                (data.images || []).map(img => uploadImage(img.url || img))
            );

            const processedVideos = await Promise.all(
                (data.videos || []).map(video => uploadVideo(video.url || video))
            );

            // 2. Upload Variation Images
            let processedVariations = [];
            if (data.hasVariations && data.variation_matrix?.length > 0) {
                processedVariations = await Promise.all(
                    data.variation_matrix.map(async (variant) => {
                        let imageUrl = variant.image;
                        if (variant.image) {
                            imageUrl = await uploadImage(variant.image);
                        }
                        return { ...variant, image: imageUrl };
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

            if (!isEdit) {
                localStorage.removeItem(`budol-product-draft-${storeId}`);
            }

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
                                        <span className="text-red-500">*</span>
                                    </div>
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
                                        render={({ field: { value, onChange } }) => (
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
                                        )}
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
