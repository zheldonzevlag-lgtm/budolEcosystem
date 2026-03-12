'use client'

import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Upload, Wand2, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { uploadImage } from '@/lib/uploadUtils';

function SortableImage({ id, src, uploading, error, onRemove, onUpdate, allImages }) {
  const [processing, setProcessing] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const handleRemoveBackground = async (e) => {
    e.stopPropagation(); // Prevent drag start
    if (processing || uploading) return;

    try {
      setProcessing(true);
      toast.loading('Removing background with Cloudinary AI...', { id: 'bg-remove' });

      // Check if this is a local blob URL - if so, we need to upload first
      let imageToProcess = src;
      let alreadyUploaded = false;

      // If it's a local blob URL, we need to upload it first
      if (src && src.startsWith('blob:')) {
        // The file should be in the image object - let's get it
        const imageObj = allImages && allImages.find((img, index) => {
          const currentId = img.id || `fallback-id-${index}`;
          return currentId === id;
        });

        if (imageObj && imageObj.file) {
          // Upload the local file with background removal in one step
          const formData = new FormData();
          formData.append('file', imageObj.file);
          formData.append('removeBackground', 'true');
          formData.append('type', 'product');

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to remove background');
          }

          // Update the image with the processed URL and mark as uploaded
          onUpdate(id, data.url, true); // true = alreadyUploaded
          toast.success('Background removed! Image uploaded.', { id: 'bg-remove' });
          setProcessing(false);
          return;
        }
      }

      // For already-uploaded images (Cloudinary URLs)
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: src,
          removeBackground: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove background');
      }

      // Cloudinary returns the URL of the image with background removed
      // We update the image with this new URL
      onUpdate(id, data.url, true); // true = alreadyUploaded (since original was already on Cloudinary)
      toast.success('Background removed successfully!', { id: 'bg-remove' });
    } catch (error) {
      console.error('Background removal failed:', error);
      toast.error(error.message || 'Failed to remove background.', { id: 'bg-remove' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square rounded-lg overflow-visible border border-slate-200 group bg-white cursor-grab active:cursor-grabbing"
    >
      {/* Drag Handle Area (entire image) */}
      <div {...attributes} {...listeners} className="absolute inset-0 z-10" />

      {src && (
        <Image
          src={src}
          alt="Product Image"
          fill
          className={`object-cover ${(processing || uploading) ? 'opacity-50 blur-[2px]' : ''} transition-all`}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
        />
      )}

      {/* Loading Overlay */}
      {(processing || uploading) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          {uploading && (
            <div className="absolute bottom-2 left-0 right-0 text-center">
              <span className="text-[10px] font-bold text-indigo-600 bg-white/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Uploading...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-50/80 p-2">
          <AlertCircle className="w-6 h-6 text-red-500 mb-1" />
          <span className="text-[10px] font-bold text-red-600 text-center leading-tight">
            Upload Failed
          </span>
        </div>
      )}

      {/* Actions Container */}
      <div className="absolute top-1 right-1 z-20 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        {/* Magic Remove BG Button with Professional Tooltip */}
        {!uploading && !error && src && (src.startsWith('http') || src.startsWith('blob:')) && (
          <div className="relative group/tooltip">
            <button
              type="button"
              onClick={handleRemoveBackground}
              disabled={processing}
              className="bg-indigo-600 text-white rounded-full p-1.5 hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
            >
              <Wand2 size={12} />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all whitespace-nowrap z-[100]">
              Remove Background
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
            </div>
          </div>
        )}

        {/* Remove Image Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
          className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-sm transition-colors"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

export default function DragDropImageUpload({ images = [], onChange, maxImages = 8 }) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;
    if (active.id === over.id) return;

    // Map using normalized IDs to ensure stability even when original items have no id
    const normalized = images.map((img, index) =>
      typeof img === 'string' ? { id: `fallback-id-${index}`, url: img } : (img.id ? img : { ...img, id: `fallback-id-${index}` })
    );

    const oldIndex = normalized.findIndex((img) => img.id === active.id);
    const newIndex = normalized.findIndex((img) => img.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images.`);
      return;
    }

    // Generate temporary preview objects - just store locally, don't upload yet!
    // Upload will happen only when product is published
    const newItems = files.map(file => ({
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: URL.createObjectURL(file), // Local preview
      file, // Keep file for upload on publish
      uploading: false, // Not uploading yet - will upload on submit
      pendingUpload: true, // Mark as pending upload
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    }));

    // Update parent state with items
    onChange([...images, ...newItems]);
    e.target.value = ''; // Reset input
    
    toast.success(`${newItems.length} image(s) added. They will be uploaded when you publish.`);
  };

  const handleRemove = (id) => {
    // Normalize the id to match what normalizedImages creates
    // The id passed could be from normalizedImages (img-str-X, img-obj-X) 
    // or the original image object id
    console.log('[DragDropImageUpload] handleRemove called with id:', id);
    console.log('[DragDropImageUpload] Current images:', images.length);
    
    const newImages = images.filter((img, index) => {
      // Build the normalized id the same way normalizedImages does
      let normalizedId;
      if (typeof img === 'string') {
        normalizedId = `img-str-${index}`;
      } else if (!img.id) {
        normalizedId = `img-obj-${index}`;
      } else {
        normalizedId = img.id;
      }
      
      // Also check the fallback pattern
      const fallbackId = `fallback-id-${index}`;
      
      // Return true (keep) if id doesn't match
      return normalizedId !== id && fallbackId !== id && img.id !== id;
    });
    
    console.log('[DragDropImageUpload] After remove:', newImages.length, 'images');
    onChange(newImages);
  };

  const handleImageUpdate = (id, newUrl, alreadyUploaded = false) => {
    const newImages = images.map((img, index) => {
      const currentId = img.id || `fallback-id-${index}`;
      if (currentId === id) {
        // Handle string images vs object images
        if (typeof img === 'string') {
          // If it's just a string URL, convert to object with the new URL
          return { 
            id: img.id || `fallback-id-${index}`, 
            url: newUrl,
            uploaded: true // Mark as uploaded since we have a Cloudinary URL
          };
        }
        // Update the image object with new URL and mark as uploaded
        return { 
          ...img, 
          url: newUrl,
          uploaded: alreadyUploaded || img.uploaded, // Keep existing upload status or set to true
          pendingUpload: alreadyUploaded ? false : img.pendingUpload // No longer pending if already uploaded
        };
      }
      return img;
    });
    onChange(newImages);
  };

  // Memoize normalized images to ensure consistent IDs for dnd-kit
  // This is a safety net in case parent component passes non-normalized images
  const normalizedImages = useMemo(() => {
    return images.map((img, index) => {
      if (typeof img === 'string') {
        return { id: `img-str-${index}`, url: img };
      }
      if (!img.id) {
        return { ...img, id: `img-obj-${index}` };
      }
      return img;
    });
  }, [images]);

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={normalizedImages.map(img => img.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {normalizedImages.map((image, idx) => (
              <SortableImage
                key={image.id}
                id={image.id}
                src={image.url || image.src}
                uploading={image.uploading}
                error={image.error}
                onRemove={handleRemove}
                onUpdate={handleImageUpdate}
                allImages={images}
              />
            ))}

            {/* Upload Button */}
            {images.length < maxImages && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors bg-slate-50">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Upload className="text-slate-400 mb-2" />
                <span className="text-xs text-slate-500 font-medium">Add Image</span>
              </label>
            )}
          </div>
        </SortableContext>

        {/* Drag Overlay for smooth preview */}
        <DragOverlay>
          {activeId ? (
            <div className="aspect-square rounded-lg overflow-hidden border border-blue-500 shadow-lg bg-white opacity-80">
              {(() => {
                const img = normalizedImages.find(i => i.id === activeId);
                if (img) {
                  return <Image src={img.url || img.src} alt="Dragging" fill className="object-cover" />;
                }
                return null;
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

    </div>
  );
}
