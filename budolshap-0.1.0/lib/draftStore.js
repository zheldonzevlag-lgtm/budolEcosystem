/**
 * Draft Store - IndexedDB Storage with Multi-Draft Support
 * 
 * Features:
 * - Multiple drafts support (dynamic number)
 * - Instant local persistence for smooth UX on slow networks
 * - Background upload to Cloudinary
 * - Proper handling of variant images (both blob and Cloudinary URLs)
 * - Draft metadata for list display (name, date, images)
 */

const DB_NAME = 'budolshap-drafts';
const DB_VERSION = 3; // Bumped to clear old corrupted drafts
const STORE_NAME = 'product-drafts';

// Initialize IndexedDB
const initDB = () => {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            resolve(null);
            return;
        }
        
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('[draftStore] Failed to open IndexedDB:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                // Create indexes for querying
                store.createIndex('storeId', 'storeId', { unique: false });
                store.createIndex('updatedAt', 'updatedAt', { unique: false });
            }
        };
    });
};

// Convert File/Blob to base64 for storage
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Convert base64 back to Blob
const base64ToBlob = (base64, mimeType) => {
    try {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    } catch (e) {
        console.error('[draftStore] Error converting base64 to blob:', e);
        return null;
    }
};

// Generate unique ID for draft
const generateDraftId = () => {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Process data to prepare for IndexedDB storage
// Converts File objects to base64 for persistence
const prepareForStorage = async (data) => {
    if (!data) return null;
    
    const processed = { ...data };
    
    // Process main images
    if (processed.images && Array.isArray(processed.images)) {
        processed.images = await Promise.all(
            processed.images.map(async (img) => {
                if (img.file) {
                    // Convert File to base64 for storage
                    const base64 = await fileToBase64(img.file);
                    return {
                        ...img,
                        fileData: base64,
                        fileName: img.file.name,
                        fileType: img.file.type,
                        // Keep blob URL for current session display
                        url: img.url || URL.createObjectURL(img.file)
                    };
                }
                return img;
            })
        );
    }
    
    // Process videos
    if (processed.videos && Array.isArray(processed.videos)) {
        processed.videos = await Promise.all(
            processed.videos.map(async (video) => {
                if (video.file) {
                    const base64 = await fileToBase64(video.file);
                    return {
                        ...video,
                        fileData: base64,
                        fileName: video.file.name,
                        fileType: video.file.type,
                        url: video.url || URL.createObjectURL(video.file)
                    };
                }
                return video;
            })
        );
    }
    
    // Process variation matrix images
    if (processed.variation_matrix && Array.isArray(processed.variation_matrix)) {
        processed.variation_matrix = await Promise.all(
            processed.variation_matrix.map(async (variant) => {
                if (variant.image?.file) {
                    const base64 = await fileToBase64(variant.image.file);
                    return {
                        ...variant,
                        image: {
                            ...variant.image,
                            fileData: base64,
                            fileName: variant.image.file.name,
                            fileType: variant.image.file.type,
                            url: variant.image.url || URL.createObjectURL(variant.image.file)
                        }
                    };
                }
                return variant;
            })
        );
    }
    
    // Add metadata
    const now = new Date().toISOString();
    processed._savedAt = now;
    processed._updatedAt = now;
    processed._uploadStatus = 'pending'; // pending, uploading, completed, failed
    
    // Generate preview info for list display
    processed._preview = {
        name: processed.name || 'Untitled Product',
        // Get first image URL for preview
        thumbnail: processed.images?.[0]?.url || 
                   processed.variation_matrix?.[0]?.image?.url || 
                   null,
        // Count total media
        imageCount: (processed.images || []).length,
        videoCount: (processed.videos || []).length,
        variantCount: (processed.variation_matrix || []).length
    };
    
    return processed;
};

// Process data after retrieving from IndexedDB
// Converts base64 back to usable blob URLs
const processFromStorage = (data) => {
    if (!data) return null;
    
    const processed = { ...data };
    
    // Process main images
    if (processed.images && Array.isArray(processed.images)) {
        processed.images = processed.images.map((img) => {
            if (img.fileData && !img.url?.startsWith('http')) {
                // Convert base64 to blob URL for display
                const blob = base64ToBlob(img.fileData, img.fileType || 'image/jpeg');
                if (blob) {
                    const blobUrl = URL.createObjectURL(blob);
                    return {
                        ...img,
                        url: blobUrl,
                        // Keep fileData for re-upload
                        _isLocal: true
                    };
                }
            }
            return img;
        });
    }
    
    // Process videos
    if (processed.videos && Array.isArray(processed.videos)) {
        processed.videos = processed.videos.map((video) => {
            if (video.fileData && !video.url?.startsWith('http')) {
                const blob = base64ToBlob(video.fileData, video.fileType || 'video/mp4');
                if (blob) {
                    const blobUrl = URL.createObjectURL(blob);
                    return {
                        ...video,
                        url: blobUrl,
                        _isLocal: true
                    };
                }
            }
            return video;
        });
    }
    
    // Process variation matrix images
    if (processed.variation_matrix && Array.isArray(processed.variation_matrix)) {
        processed.variation_matrix = processed.variation_matrix.map((variant) => {
            if (variant.image?.fileData && !variant.image?.url?.startsWith('http')) {
                const blob = base64ToBlob(variant.image.fileData, variant.image.fileType || 'image/jpeg');
                if (blob) {
                    const blobUrl = URL.createObjectURL(blob);
                    return {
                        ...variant,
                        image: {
                            ...variant.image,
                            url: blobUrl,
                            _isLocal: true
                        }
                    };
                }
            }
            return variant;
        });
    }
    
    return processed;
};

// Save draft to IndexedDB - creates new draft or updates existing
export const saveDraft = async (storeId, data, existingDraftId = null) => {
    try {
        const db = await initDB();
        if (!db) {
            console.log('[draftStore] IndexedDB not available');
            return existingDraftId || null;
        }
        
        // Prepare data for storage (convert files to base64)
        const processedData = await prepareForStorage(data);
        
        // Use existing ID or generate new one
        const draftId = existingDraftId || generateDraftId();
        
        console.log('[draftStore] saveDraft called with storeId:', storeId, 'draftId:', draftId, 'existingDraftId:', existingDraftId);
        
        // Get existing draft if updating
        let existingDraft = null;
        if (existingDraftId) {
            existingDraft = await getDraft(existingDraftId);
        }
        
        // Get all existing keys to check what's in the database
        const txCheck = db.transaction(STORE_NAME, 'readonly');
        const storeCheck = txCheck.objectStore(STORE_NAME);
        const allKeysBefore = await new Promise((resolve, reject) => {
            const request = storeCheck.getAllKeys();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        console.log('[draftStore] All keys in DB before save:', allKeysBefore);
        
        const draft = {
            id: draftId,
            storeId,
            ...processedData,
            _updatedAt: new Date().toISOString(),
            // Preserve creation date if updating
            _createdAt: existingDraft?._createdAt || new Date().toISOString()
        };
        
        console.log('[draftStore] About to save draft with id:', draft.id);
        
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        await new Promise((resolve, reject) => {
            const request = store.put(draft);
            request.onsuccess = () => resolve(draftId);
            request.onerror = () => reject(request.error);
        });
        
        console.log('[draftStore] Draft saved:', draftId, draft._preview);
        return draftId;
    } catch (error) {
        console.error('[draftStore] Error saving draft:', error);
        return null;
    }
};

// Get draft by ID
export const getDraft = async (draftId) => {
    try {
        const db = await initDB();
        if (!db) return null;
        
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        
        console.log('[draftStore] getDraft called with ID:', draftId);
        
        // First try to get by draftId
        let draft = await new Promise((resolve, reject) => {
            const request = store.get(draftId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        
        // If not found, get all and search manually (handles legacy data)
        if (!draft) {
            console.log('[draftStore] Draft not found by ID, searching all drafts...');
            const allDrafts = await new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            
            console.log('[draftStore] All drafts:', allDrafts?.map(d => ({ id: d.id, storeId: d.storeId })));
            
            // Try to find by id property (handles case where key is storeId)
            draft = allDrafts?.find(d => d.id === draftId) || null;
            
            // If still not found and draftId looks like a storeId, try finding by storeId
            if (!draft && draftId?.startsWith && (draftId.startsWith('cmm') || draftId.length > 20)) {
                draft = allDrafts?.find(d => d.storeId === draftId) || null;
            }
        }
        
        if (!draft) return null;
        
        // Process data from storage (convert base64 to blob URLs)
        const processed = processFromStorage(draft);
        
        console.log('[draftStore] Draft retrieved:', draftId, processed._preview);
        
        return processed;
    } catch (error) {
        console.error('[draftStore] Error getting draft:', error);
        return null;
    }
};

// Get all drafts for a store
export const getAllDrafts = async (storeId) => {
    try {
        const db = await initDB();
        if (!db) return [];
        
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        
        // Get all drafts and filter by storeId
        const allDrafts = await new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        
        console.log('[draftStore] All drafts found:', allDrafts?.length);
        console.log('[draftStore] All draft IDs:', allDrafts?.map(d => d.id));
        console.log('[draftStore] Looking for storeId:', storeId);
        
        // Filter by storeId
        const filteredDrafts = (allDrafts || []).filter(draft => draft.storeId === storeId);
        
        console.log('[draftStore] Filtered drafts:', filteredDrafts?.length);
        
        // Sort by updated date (newest first)
        const sortedDrafts = filteredDrafts.sort((a, b) => {
            return new Date(b._updatedAt) - new Date(a._updatedAt);
        });
        
        // Process each draft for display (get blob URLs for previews)
        return sortedDrafts.map(draft => ({
            id: draft.id,
            storeId: draft.storeId,
            name: draft.name || 'Untitled Product',
            _createdAt: draft._createdAt,
            _updatedAt: draft._updatedAt,
            _preview: draft._preview,
            // Get first image for thumbnail
            thumbnail: draft.images?.[0]?.url || 
                       draft.variation_matrix?.[0]?.image?.url || 
                       null
        }));
    } catch (error) {
        console.error('[draftStore] Error getting all drafts:', error);
        return [];
    }
};

// Delete draft from IndexedDB
export const deleteDraft = async (draftId) => {
    try {
        const db = await initDB();
        if (!db) return true;
        
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        await new Promise((resolve, reject) => {
            const request = store.delete(draftId);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
        
        console.log('[draftStore] Draft deleted:', draftId);
        return true;
    } catch (error) {
        console.error('[draftStore] Error deleting draft:', error);
        return false;
    }
};

// Get drafts with incomplete uploads
export const getDraftsWithIncompleteUploads = async (storeId) => {
    try {
        const db = await initDB();
        if (!db) return [];
        
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('storeId');
        
        const drafts = await new Promise((resolve, reject) => {
            const request = index.getAll(storeId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        
        return (drafts || []).filter(draft => draft._uploadStatus !== 'completed');
    } catch (error) {
        console.error('[draftStore] Error getting incomplete drafts:', error);
        return [];
    }
};

// Clear all drafts for a store
export const clearAllDrafts = async (storeId) => {
    try {
        const db = await initDB();
        if (!db) return true;
        
        const drafts = await getAllDrafts(storeId);
        
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        for (const draft of drafts) {
            await new Promise((resolve, reject) => {
                const request = store.delete(draft.id);
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        }
        
        console.log('[draftStore] All drafts cleared for store:', storeId);
        return true;
    } catch (error) {
        console.error('[draftStore] Error clearing drafts:', error);
        return false;
    }
};

// Analyze draft upload status
export const analyzeDraftUploads = (draft) => {
    if (!draft) {
        return {
            hasIncompleteUploads: false,
            totalItems: 0,
            completedItems: 0,
            pendingItems: 0,
            failedItems: 0
        };
    }
    
    let totalItems = 0;
    let completedItems = 0;
    let pendingItems = 0;
    let failedItems = 0;
    
    // Count main images
    if (draft.images) {
        draft.images.forEach(img => {
            totalItems++;
            if (img.url?.startsWith('http')) {
                completedItems++;
            } else if (img._isLocal) {
                pendingItems++;
            }
        });
    }
    
    // Count videos
    if (draft.videos) {
        draft.videos.forEach(video => {
            totalItems++;
            if (video.url?.startsWith('http')) {
                completedItems++;
            } else if (video._isLocal) {
                pendingItems++;
            }
        });
    }
    
    // Count variation images
    if (draft.variation_matrix) {
        draft.variation_matrix.forEach(variant => {
            if (variant.image) {
                totalItems++;
                if (variant.image.url?.startsWith('http')) {
                    completedItems++;
                } else if (variant.image._isLocal) {
                    pendingItems++;
                }
            }
        });
    }
    
    return {
        hasIncompleteUploads: pendingItems > 0,
        totalItems,
        completedItems,
        pendingItems,
        failedItems
    };
};

// Get draft count for a store
export const getDraftCount = async (storeId) => {
    try {
        const drafts = await getAllDrafts(storeId);
        return drafts.length;
    } catch (error) {
        console.error('[draftStore] Error getting draft count:', error);
        return 0;
    }
};

// Default export
const draftStore = {
    saveDraft,
    getDraft,
    getAllDrafts,
    deleteDraft,
    getDraftsWithIncompleteUploads,
    clearAllDrafts,
    analyzeDraftUploads,
    getDraftCount
};

export default draftStore;
