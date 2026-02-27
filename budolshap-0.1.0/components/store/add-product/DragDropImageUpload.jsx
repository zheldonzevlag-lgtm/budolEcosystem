'use client'

import { useState } from 'react';
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
import { X, Upload, Wand2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { compressImage } from '@/lib/imageUtils';
import { toast } from 'react-hot-toast';

function SortableImage({ id, src, onRemove, onUpdate }) {
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
    if (processing) return;

    try {
      setProcessing(true);
      toast.loading('Removing background with Cloudinary AI...', { id: 'bg-remove' });

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
      onUpdate(id, data.url);
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
          className={`object-cover ${processing ? 'opacity-50 blur-sm' : ''} transition-all`}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
        />
      )}

      {/* Loading Overlay */}
      {processing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      )}

      {/* Actions Container */}
      <div className="absolute top-1 right-1 z-20 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        {/* Magic Remove BG Button with Professional Tooltip */}
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

    const toastId = toast.loading('Processing images...');
    const processedFiles = [];

    try {
      for (const file of files) {
        // Compress image
        const compressedBase64 = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8
        });
        processedFiles.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: compressedBase64
        });
      }
      onChange([...images, ...processedFiles]);
      toast.success('Images added', { id: toastId });
    } catch (error) {
      console.error('Image processing failed:', error);
      toast.error('Failed to process some images', { id: toastId });
    } finally {
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemove = (id) => {
    // If we're using fallback IDs, we need to handle removal by index or check if ID exists
    // But since onChange expects the full array, we can just filter
    const newImages = images.filter((img, index) => {
      const currentId = img.id || `fallback-id-${index}`;
      return currentId !== id;
    });
    onChange(newImages);
  };

  const handleImageUpdate = (id, newUrl) => {
    const newImages = images.map((img, index) => {
      const currentId = img.id || `fallback-id-${index}`;
      if (currentId === id) {
        // Handle string images vs object images
        if (typeof img === 'string') return newUrl;
        return { ...img, url: newUrl };
      }
      return img;
    });
    onChange(newImages);
  };

  // Memoize normalized images to ensure consistent IDs for dnd-kit
  // This is a safety net in case parent component passes non-normalized images
  const normalizedImages = images.map((img, index) => {
    if (typeof img === 'string') {
      return { id: `fallback-id-${index}`, url: img };
    }
    if (!img.id) {
      return { ...img, id: `fallback-id-${index}` };
    }
    return img;
  });

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
            {normalizedImages.map((image) => (
              <SortableImage
                key={image.id}
                id={image.id}
                src={image.url || image.src}
                onRemove={handleRemove}
                onUpdate={handleImageUpdate}
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
