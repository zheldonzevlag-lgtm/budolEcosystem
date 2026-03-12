'use client'

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Image as ImageIcon, Check, X, Eye, Loader2, Wand2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { uploadImage } from '@/lib/uploadUtils';

const VariationMatrixManager = ({ initialData, onUpdate, errors = [] }) => {
    // State for Tiers (e.g., Color, Size)
    const [tiers, setTiers] = useState(initialData?.tier_variations || [
        { name: 'Color', options: [''] }
    ]);

    // State for the generated SKU Matrix
    const [matrix, setMatrix] = useState(initialData?.variation_matrix || []);
    const [parentSku, setParentSku] = useState(initialData?.parent_sku || '');
    const [hiddenCombos, setHiddenCombos] = useState(initialData?.hidden_combos || []);
    
    // Preview Modal State
    const [previewImage, setPreviewImage] = useState(null); // { url: string, index: number, raw: File|string }
    const [isRemovingBg, setIsRemovingBg] = useState(false);

    const fileInputRef = useRef(null);
    const activeIndexRef = useRef(null);
    const isSelfUpdate = useRef(false);
    
    // Track initialization to prevent image loss on first render
    const isInitialized = useRef(false);
    const isInitialMount = useRef(true);
    const isEditingMatrix = useRef(false); // Track when user is actively editing

    const handleImageAction = (index) => {
        activeIndexRef.current = index;
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (file && activeIndexRef.current !== null) {
            const index = activeIndexRef.current;
            const tempId = `temp-${Date.now()}`;
            const localPreviewUrl = URL.createObjectURL(file);

            // Store file locally for upload on publish (not immediate upload)
            updateMatrixItem(index, 'image', { 
                url: localPreviewUrl, 
                uploading: false,
                pendingUpload: true,
                file: file, // Store file for later upload
                fileName: file.name,
                fileType: file.type,
                id: tempId
            });

            // Note: Upload happens on publish, not here
            toast.success('Variant image added. It will be uploaded when you publish.');
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveBackground = async () => {
        if (!previewImage || isRemovingBg) return;

        try {
            setIsRemovingBg(true);
            toast.loading('Removing background with Cloudinary AI...', { id: 'bg-remove-variant' });

            let imagePayload = previewImage.raw;

            // Handle object format
            if (imagePayload && typeof imagePayload === 'object' && imagePayload.url) {
                imagePayload = imagePayload.url;
            }

            // Validate we have a valid image
            if (!imagePayload || (typeof imagePayload === 'string' && imagePayload.length < 10)) {
                throw new Error('No valid image found. Please upload an image first.');
            }

            // Check if it's a blob URL (local preview) - need to convert to base64 first
            if (imagePayload.startsWith('blob:')) {
                throw new Error('Please save/publish the product first before removing background, or upload the image to Cloudinary first.');
            }

            // Check if it's not a valid URL
            if (!imagePayload.startsWith('http')) {
                throw new Error('Invalid image URL. Please ensure the image is uploaded to Cloudinary first.');
            }

            console.log('[Remove BG] Sending request with image:', typeof imagePayload, imagePayload?.substring(0, 100));

            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imagePayload,
                    removeBackground: true
                }),
            });

            const data = await response.json();
            console.log('[Remove BG] Response:', response.status, data);

            if (!response.ok) {
                throw new Error(data.error || `Upload failed with status ${response.status}`);
            }

            // Update the matrix item with the new URL
            updateMatrixItem(previewImage.index, 'image', data.url);
            
            // Update preview modal
            setPreviewImage({
                ...previewImage,
                url: data.url,
                raw: data.url,
                bgRemoved: true
            });

            toast.success('Background removed successfully!', { id: 'bg-remove-variant' });
        } catch (error) {
            console.error('Background removal failed:', error);
            toast.error(error.message || 'Failed to remove background.', { id: 'bg-remove-variant' });
        } finally {
            setIsRemovingBg(false);
        }
    };

    // 1. Add/Remove Tiers
    const addTier = () => {
        if (tiers.length < 2) {
            setTiers([...tiers, { name: '', options: [''] }]);
        }
    };

    const removeTier = (index) => {
        const newTiers = tiers.filter((_, i) => i !== index);
        setTiers(newTiers);
    };

    // 2. Add/Remove Options within a Tier
    const addOption = (tierIndex) => {
        const newTiers = [...tiers];
        newTiers[tierIndex].options.push('');
        setTiers(newTiers);
    };

    const updateOption = (tierIndex, optIndex, value) => {
        const newTiers = [...tiers];
        newTiers[tierIndex].options[optIndex] = value;
        setTiers(newTiers);
    };

    const removeOption = (tierIndex, optIndex) => {
        const newTiers = [...tiers];
        newTiers[tierIndex].options = newTiers[tierIndex].options.filter((_, i) => i !== optIndex);
        setTiers(newTiers);
    };

    // 3. Generate Matrix Grid based on Tiers
    // IMPORTANT: Only regenerate matrix when user changes tiers/options
    // Don't regenerate on initial load - that would lose existing variant images!
    useEffect(() => {
        // Skip if we're currently editing the matrix (prevent losing edits)
        if (isEditingMatrix.current) {
            console.log('[VariationMatrixManager] ⚠️ SKIPPING generateMatrix - isEditingMatrix is true');
            return;
        }
        
        // Skip if we have initial data with variations that haven't been processed yet
        // This prevents losing images when loading a saved draft
        if (isInitialMount.current && initialData?.variation_matrix?.length > 0) {
            isInitialMount.current = false;
            console.log('[VariationMatrixManager] ⚠️ SKIPPING generateMatrix - Initial mount with existing matrix');
            // Just update parent - don't regenerate which would create new entries
            onUpdate({ tier_variations: tiers, variation_matrix: matrix, parent_sku: parentSku, hidden_combos: hiddenCombos });
            return;
        }
        isInitialMount.current = false;
        
        // Only generate if we actually have tiers with options
        const hasValidTiers = tiers.some(t => t.name && t.options.some(opt => opt.trim() !== ''));
        if (!hasValidTiers) {
            console.log('[VariationMatrixManager] ⚠️ SKIPPING generateMatrix - No valid tiers');
            return;
        }
        
        console.log('[VariationMatrixManager] 🔧 CALLING generateMatrix() - tiers/parentSku/hiddenCombos changed');
        console.log('[VariationMatrixManager] Current matrix before generateMatrix:', matrix.length, 'variants');
        matrix.forEach((m, i) => {
            console.log(`  Variant ${i}:`, { hasImage: !!m.image, sku: m.sku });
        });
        generateMatrix();
    }, [tiers, parentSku, hiddenCombos]);

    // Sync state with initialData (crucial for edit mode when data is fetched asynchronously)
    // IMPORTANT: Only sync from initialData when it's NEWER than our current matrix
    // This prevents overwriting user edits with old draft data
    useEffect(() => {
        if (!initialData) return;
        
        // Skip if we're currently updating from user action (prevent circular updates)
        if (isSelfUpdate.current || isEditingMatrix.current) {
            console.log('[VariationMatrixManager] Skipping initialData sync - isSelfUpdate or isEditingMatrix is true');
            isSelfUpdate.current = false;
            return;
        }
        
        console.log('[VariationMatrixManager] Syncing with initialData:', {
            hasTierVariations: !!initialData.tier_variations,
            hasVariationMatrix: !!initialData.variation_matrix,
            matrixLength: initialData.variation_matrix?.length,
            currentMatrixLength: matrix.length
        });
        
        // Mark as initialized when we receive initial data with variations
        if (initialData.variation_matrix?.length > 0) {
            isInitialized.current = true;
            console.log('[VariationMatrixManager] Marked as initialized with', initialData.variation_matrix.length, 'variants');
        }
        
        // Use JSON stringify for deep comparison to avoid infinite loops and unnecessary updates
        if (initialData.tier_variations && JSON.stringify(initialData.tier_variations) !== JSON.stringify(tiers)) {
            console.log('[VariationMatrixManager] Updating tiers');
            setTiers(initialData.tier_variations);
        }
        if (initialData.variation_matrix && JSON.stringify(initialData.variation_matrix) !== JSON.stringify(matrix)) {
            console.log('[VariationMatrixManager] Updating matrix from', matrix.length, 'to', initialData.variation_matrix.length, 'variants');
            // Log the images in each variant
            initialData.variation_matrix.forEach((v, i) => {
                console.log(`  Variant ${i}:`, { 
                    hasImage: !!v.image, 
                    imageType: typeof v.image,
                    imageValue: v.image?.url || v.image
                });
            });
            setMatrix(initialData.variation_matrix);
        }
        if (initialData.parent_sku !== undefined && initialData.parent_sku !== parentSku) {
            setParentSku(initialData.parent_sku);
        }
        if (initialData.hidden_combos && JSON.stringify(initialData.hidden_combos) !== JSON.stringify(hiddenCombos)) {
            setHiddenCombos(initialData.hidden_combos);
        }
    }, [initialData]);

    const generateMatrix = (preserveExistingImages = false) => {
        // Only generate if we have names and options
        const validTiers = tiers.filter(t => t.name && t.options.some(opt => opt.trim() !== ''));
        if (validTiers.length === 0) return;

        console.log('[VariationMatrixManager] generateMatrix() running...');
        console.log('[VariationMatrixManager] Current matrix state:', matrix.length, 'variants');
        
        let combinations = [[]];
        validTiers.forEach((tier, tIdx) => {
            const newCombinations = [];
            tier.options.filter(opt => opt.trim() !== '').forEach((opt, oIdx) => {
                combinations.forEach(combo => {
                    newCombinations.push([...combo, oIdx]);
                });
            });
            combinations = newCombinations;
        });

        const newMatrix = combinations
            .filter(combo => !hiddenCombos.some(hc => JSON.stringify(hc) === JSON.stringify(combo)))
            .map(combo => {
                // Try to find existing data for this combo - CRITICAL: preserve existing images!
                const existing = matrix.find(m =>
                    JSON.stringify(m.tier_index) === JSON.stringify(combo)
                );

                if (existing) {
                    console.log(`[VariationMatrixManager] Preserving existing variant:`, { tier_index: combo, hasImage: !!existing.image });
                    // Preserve existing variant INCLUDING its image!
                    return existing;
                }

                // Generate SKU name
                const skuParts = combo.map((oIdx, tIdx) => validTiers[tIdx].options[oIdx]);
                const generatedSku = `${parentSku}-${skuParts.join('-')}`.toUpperCase();

                console.log(`[VariationMatrixManager] Creating NEW variant:`, { tier_index: combo, sku: generatedSku });
                return {
                    sku: generatedSku,
                    tier_index: combo,
                    price: initialData?.price || 0,
                    mrp: initialData?.mrp || 0,
                    stock: 0,
                    image: null
                };
            });

        console.log('[VariationMatrixManager] New matrix generated:', newMatrix.length, 'variants');
        newMatrix.forEach((m, i) => {
            console.log(`  New Variant ${i}:`, { hasImage: !!m.image, sku: m.sku });
        });
        
        setMatrix(newMatrix);
        isSelfUpdate.current = true;
        onUpdate({ tier_variations: tiers, variation_matrix: newMatrix, parent_sku: parentSku, hidden_combos: hiddenCombos });
    };

    const removeMatrixItem = (index) => {
        const itemToRemove = matrix[index];
        const comboToHide = itemToRemove.tier_index;
        
        setHiddenCombos([...hiddenCombos, comboToHide]);
        // useEffect will trigger generateMatrix and update onUpdate automatically
    };

    const restoreHiddenItems = () => {
        setHiddenCombos([]);
    };

    const updateMatrixItem = (index, field, value) => {
        console.log('[VariationMatrixManager] updateMatrixItem called:', { index, field, value: typeof value === 'object' ? 'object' : value });
        console.log('[VariationMatrixManager] Current matrix before update:', matrix.length, 'variants');
        matrix.forEach((m, i) => {
            console.log(`  Variant ${i}:`, { hasImage: !!m.image, imageValue: m.image?.url || m.image });
        });
        
        // Mark that we're editing the matrix - this prevents sync useEffect from overwriting
        isEditingMatrix.current = true;
        isSelfUpdate.current = true;
        
        const newMatrix = [...matrix];
        newMatrix[index][field] = value;
        setMatrix(newMatrix);
        
        console.log('[VariationMatrixManager] Matrix after update:');
        newMatrix.forEach((m, i) => {
            console.log(`  Variant ${i}:`, { hasImage: !!m.image, imageValue: m.image?.url || m.image });
        });
        
        onUpdate({ tier_variations: tiers, variation_matrix: newMatrix, parent_sku: parentSku, hidden_combos: hiddenCombos });
        
        // Clear editing flag after a short delay to allow React to process the update
        setTimeout(() => {
            isEditingMatrix.current = false;
        }, 100);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
            {/* Parent SKU */}
            <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 mb-2">Parent SKU</label>
                <input
                    type="text"
                    value={parentSku}
                    onChange={(e) => setParentSku(e.target.value)}
                    placeholder="e.g., TSHIRT-001"
                    className="w-full max-w-xs bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:ring-2 ring-slate-200 transition"
                />
            </div>

            {/* Tier Configuration */}
            <div className="space-y-6 mb-10">
                {tiers.map((tier, tIdx) => (
                    <div key={tIdx} className="bg-slate-50 border border-slate-200 rounded-lg p-4 relative">
                        <button
                            type="button"
                            onClick={() => removeTier(tIdx)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition"
                        >
                            <Trash2 size={18} />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Variation Name</label>
                                <input
                                    type="text"
                                    value={tier.name}
                                    onChange={(e) => {
                                        const newTiers = [...tiers];
                                        newTiers[tIdx].name = e.target.value;
                                        setTiers(newTiers);
                                    }}
                                    placeholder="e.g., Color"
                                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 outline-none"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Options</label>
                                <div className="flex flex-wrap gap-2">
                                    {tier.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => updateOption(tIdx, oIdx, e.target.value)}
                                                className="bg-transparent outline-none text-sm w-20"
                                            />
                                            <button type="button" onClick={() => removeOption(tIdx, oIdx)} className="text-slate-300 hover:text-red-400">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => addOption(tIdx)}
                                        className="flex items-center gap-1 px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-300 transition"
                                    >
                                        <Plus size={14} /> Add Option
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {tiers.length < 2 && (
                    <button
                        type="button"
                        onClick={addTier}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl hover:border-slate-400 hover:text-slate-700 transition w-full justify-center"
                    >
                        <Plus size={20} /> Add Variation Type (Tier {tiers.length + 1})
                    </button>
                )}
            </div>

            {/* SKU Matrix Table */}
            {matrix.length > 0 && (
                <div className="overflow-x-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase">Variation Matrix</h3>
                        {hiddenCombos.length > 0 && (
                            <button
                                type="button"
                                onClick={restoreHiddenItems}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition flex items-center gap-1"
                            >
                                <Plus size={14} /> Restore {hiddenCombos.length} Hidden Variations
                            </button>
                        )}
                    </div>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-left">
                                <th className="p-3 border border-slate-200 text-xs font-semibold text-slate-600">Variation</th>
                                <th className="p-3 border border-slate-200 text-xs font-semibold text-slate-600">Price</th>
                                <th className="p-3 border border-slate-200 text-xs font-semibold text-slate-600">MRP</th>
                                <th className="p-3 border border-slate-200 text-xs font-semibold text-slate-600">Stock</th>
                                <th className="p-3 border border-slate-200 text-xs font-semibold text-slate-600">SKU</th>
                                <th className="p-3 border border-slate-200 text-xs font-semibold text-slate-600">Image</th>
                                <th className="p-3 border border-slate-200 text-xs font-semibold text-slate-600 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.map((item, idx) => {
                                const rowError = Array.isArray(errors) ? errors[idx] : null;
                                return (
                                <tr key={idx} className={`hover:bg-slate-50 transition group ${rowError ? 'bg-red-50/50' : ''}`}>
                                    <td className={`p-3 border border-slate-200 text-sm font-medium text-slate-700 bg-slate-50/50 ${rowError ? 'text-red-700' : ''}`}>
                                        {item.tier_index.map((oIdx, tIdx) => tiers[tIdx]?.options?.[oIdx] || '').join(' / ')}
                                    </td>
                                    <td className={`p-3 border border-slate-200 ${rowError?.price ? 'ring-1 ring-red-400' : ''}`}>
                                        <div className="flex items-center gap-1">
                                            <span className={`text-slate-400 text-xs ${rowError?.price ? 'text-red-400' : ''}`}>₱</span>
                                            <input
                                                type="number"
                                                value={item.price}
                                                onChange={(e) => updateMatrixItem(idx, 'price', parseFloat(e.target.value))}
                                                className={`w-20 bg-transparent outline-none text-sm font-medium focus:bg-white focus:ring-1 ring-slate-200 rounded px-1 ${rowError?.price ? 'text-red-600' : ''}`}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-3 border border-slate-200">
                                        <div className="flex items-center gap-1">
                                            <span className="text-slate-400 text-xs">₱</span>
                                            <input
                                                type="number"
                                                value={item.mrp}
                                                onChange={(e) => updateMatrixItem(idx, 'mrp', parseFloat(e.target.value))}
                                                className="w-20 bg-transparent outline-none text-sm text-slate-500 focus:bg-white focus:ring-1 ring-slate-200 rounded px-1"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-3 border border-slate-200">
                                        <input
                                            type="number"
                                            value={item.stock}
                                            onChange={(e) => updateMatrixItem(idx, 'stock', parseInt(e.target.value))}
                                            className="w-16 bg-transparent outline-none text-sm font-medium focus:bg-white focus:ring-1 ring-slate-200 rounded px-1"
                                            placeholder="0"
                                        />
                                    </td>
                                    <td className="p-3 border border-slate-200">
                                        <input
                                            type="text"
                                            value={item.sku}
                                            onChange={(e) => updateMatrixItem(idx, 'sku', e.target.value)}
                                            className="w-full bg-transparent outline-none text-xs text-slate-500 focus:bg-white focus:ring-1 ring-slate-200 rounded px-1 font-mono"
                                            placeholder="AUTO-SKU"
                                        />
                                    </td>
                                    <td className="p-3 border border-slate-200 text-center">
                                        {item.image ? (
                                            <div className="relative group w-10 h-10 mx-auto">
                                                <Image
                                                    src={
                                                        typeof item.image === 'string' 
                                                            ? item.image 
                                                            : (item.image && typeof item.image === 'object' && item.image.url)
                                                                ? item.image.url
                                                                : ''
                                                    }
                                                    alt="Variant"
                                                    width={40}
                                                    height={40}
                                                    className={`w-full h-full object-cover rounded border border-slate-200 ${item.image?.uploading ? 'opacity-50 blur-[1px]' : ''}`}
                                                />
                                                
                                                {item.image?.uploading && (
                                                    <div className="absolute inset-0 flex items-center justify-center z-20">
                                                        <Loader2 size={16} className="text-indigo-600 animate-spin" />
                                                    </div>
                                                )}

                                                {item.image?.error && (
                                                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-red-50/80">
                                                        <AlertCircle size={16} className="text-red-500" />
                                                    </div>
                                                )}

                                                {!item.image?.uploading && (
                                                    <button
                                                        type="button"
                                                        onClick={() => updateMatrixItem(idx, 'image', null)}
                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition shadow-sm z-30"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                )}
                                                
                                                {/* Hover Eye Overlay */}
                                                {!item.image?.uploading && !item.image?.error && (
                                                    <div 
                                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded cursor-pointer z-10"
                                                        onClick={() => {
                                                            let previewUrl = '';
                                                            if (typeof item.image === 'string') {
                                                                previewUrl = item.image;
                                                            } else if (item.image && typeof item.image === 'object' && item.image.url) {
                                                                previewUrl = item.image.url;
                                                            }

                                                            setPreviewImage({
                                                                url: previewUrl,
                                                                index: idx,
                                                                raw: item.image
                                                            });
                                                        }}
                                                    >
                                                        <Eye size={16} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleImageAction(idx)}
                                                className="text-slate-400 hover:text-slate-600 transition"
                                            >
                                                <ImageIcon size={18} />
                                            </button>
                                        )}
                                    </td>
                                    <td className="p-3 border border-slate-200 text-center">
                                        <button
                                            type="button"
                                            onClick={() => removeMatrixItem(idx)}
                                            className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100"
                                            title="Hide this variation"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}
            {/* Image Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !isRemovingBg && setPreviewImage(null)}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-semibold text-slate-800">Variant Image Preview</h3>
                            <button onClick={() => setPreviewImage(null)} disabled={isRemovingBg} className="text-slate-500 hover:text-slate-700">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 flex flex-col items-center gap-6">
                            <div className="relative w-full aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                 <Image 
                                    src={previewImage.url} 
                                    alt="Preview" 
                                    fill 
                                    className="object-contain" 
                                 />
                            </div>
                            
                            <button
                                onClick={handleRemoveBackground}
                                disabled={isRemovingBg || previewImage.bgRemoved}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                            >
                                {isRemovingBg ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Removing Background...
                                    </>
                                ) : previewImage.bgRemoved ? (
                                    <>
                                        <Check size={18} />
                                        Background Removed
                                    </>
                                ) : (
                                    <>
                                        <Wand2 size={18} />
                                        Remove Background
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VariationMatrixManager;