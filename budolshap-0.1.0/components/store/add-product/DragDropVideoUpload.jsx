'use client'

import { useState, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, Upload, Loader2, Play, Pause } from 'lucide-react'
import { toast } from 'react-hot-toast'

function SortableVideo({ id, src, onRemove }) {
  const [loading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef(null)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const handleTogglePlay = async (event) => {
    event.stopPropagation()
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.muted = false
      const playPromise = video.play()
      if (playPromise && typeof playPromise.then === 'function') {
        try {
          await playPromise
        } catch {
          video.muted = true
        }
      }
    } else {
      video.pause()
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-[23/25] rounded-lg overflow-hidden border border-slate-200 group bg-black cursor-grab active:cursor-grabbing"
    >
      {/*
        Z-index layering: drag listener at z-10 must be below play button at z-20.
        The play button uses onPointerDown stopPropagation to prevent drag initiation
        when clicking the button, allowing both interactions to work together.
      */}
      <div {...attributes} {...listeners} className="absolute inset-0 z-10" />

      {src && (
        <video
          ref={videoRef}
          src={src}
          className={`w-full h-full object-cover ${loading ? 'opacity-50' : ''}`}
          muted={!isPlaying}
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      <div className="absolute bottom-2 right-2 z-20 text-white pointer-events-none">
        <button
          type="button"
          onClick={handleTogglePlay}
          onPointerDown={(event) => event.stopPropagation()}
          className="pointer-events-auto"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm border border-white/30 hover:bg-black/70 transition-colors">
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </span>
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      <div className="absolute top-1 right-1 z-30 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(id)
          }}
          className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-sm transition-colors"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )
}

export default function DragDropVideoUpload({ videos = [], onChange, maxVideos = 0 }) {
  const [activeId, setActiveId] = useState(null)
  const maxSizeMb = 50
  const maxSizeBytes = maxSizeMb * 1024 * 1024

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return
    if (active.id === over.id) return

    const normalized = videos.map((vid, index) =>
      typeof vid === 'string' ? { id: `fallback-id-${index}`, url: vid } : (vid.id ? vid : { ...vid, id: `fallback-id-${index}` })
    )

    const oldIndex = normalized.findIndex((vid) => vid.id === active.id)
    const newIndex = normalized.findIndex((vid) => vid.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      onChange(arrayMove(videos, oldIndex, newIndex))
    }
  }

  const readVideoAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    if (videos.length + files.length > maxVideos) {
      toast.error(`You can only upload up to ${maxVideos} videos.`)
      return
    }

    const toastId = toast.loading('Processing videos...')
    const processedFiles = []

    try {
      for (const file of files) {
        if (!file.type.startsWith('video/')) {
          toast.error('Only video files are allowed.', { id: toastId })
          continue
        }
        if (file.size > maxSizeBytes) {
          toast.error(`Video exceeds ${maxSizeMb}MB limit.`, { id: toastId })
          continue
        }
        const base64 = await readVideoAsDataUrl(file)
        processedFiles.push({
          id: `vid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: base64
        })
      }
      if (processedFiles.length) {
        onChange([...videos, ...processedFiles])
        toast.success('Videos added', { id: toastId })
      } else {
        toast.dismiss(toastId)
      }
    } catch (error) {
      console.error('Video processing failed:', error)
      toast.error('Failed to process videos', { id: toastId })
    } finally {
      e.target.value = ''
    }
  }

  const handleRemove = (id) => {
    const newVideos = videos.filter((vid, index) => {
      const currentId = vid.id || `fallback-id-${index}`
      return currentId !== id
    })
    onChange(newVideos)
  }

  const normalizedVideos = videos.map((vid, index) => {
    if (typeof vid === 'string') {
      return { id: `fallback-id-${index}`, url: vid }
    }
    if (!vid.id) {
      return { ...vid, id: `fallback-id-${index}` }
    }
    return vid
  })

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={normalizedVideos.map(vid => vid.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {normalizedVideos.map((video) => (
              <SortableVideo
                key={video.id}
                id={video.id}
                src={video.url || video.src}
                onRemove={handleRemove}
              />
            ))}

            {maxVideos > 0 && videos.length < maxVideos && (
              <label className="aspect-[23/25] rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors bg-slate-50">
                <input
                  type="file"
                  multiple
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Upload className="text-slate-400 mb-2" />
                <span className="text-xs text-slate-500 font-medium">Add Video</span>
              </label>
            )}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <div className="aspect-video rounded-lg overflow-hidden border border-blue-500 shadow-lg bg-black opacity-80">
              {(() => {
                const vid = normalizedVideos.find(v => v.id === activeId)
                if (vid) {
                  return <video src={vid.url || vid.src} className="w-full h-full object-cover" muted playsInline />
                }
                return null
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <p className="text-xs text-slate-400">
        Supported formats: MP4, MOV, WEBM. Max size: {maxSizeMb}MB per video. Drag to reorder.
      </p>
    </div>
  )
}
