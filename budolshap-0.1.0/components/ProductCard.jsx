'use client'
import { StarIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const ProductCard = ({ product }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const ratingList = Array.isArray(product.rating) ? product.rating : []
    const rating = ratingList.length
        ? Math.round(ratingList.reduce((acc, curr) => acc + curr.rating, 0) / ratingList.length)
        : 0

    const videos = Array.isArray(product?.videos)
        ? product.videos
        : (typeof product?.videos === 'string'
            ? (product.videos.startsWith('[') ? JSON.parse(product.videos) : [product.videos])
            : [])
    const hasVideo = videos.length > 0

    const videoUrl = videos[0]?.url || videos[0]
    const posterImage = product.images && product.images[0] ? product.images[0] : null
    const videoRef = React.useRef(null)
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [isMuted, setIsMuted] = React.useState(true)
    const [hasUserInteracted, setHasUserInteracted] = React.useState(false)

    React.useEffect(() => {
        const handleUserInteraction = () => {
            setHasUserInteracted(true)
        }
        window.addEventListener('pointerdown', handleUserInteraction, { once: true })
        window.addEventListener('keydown', handleUserInteraction, { once: true })

        return () => {
            window.removeEventListener('pointerdown', handleUserInteraction)
            window.removeEventListener('keydown', handleUserInteraction)
        }
    }, [])

    const handleVideoPlay = (event) => {
        event.preventDefault()
        event.stopPropagation()
        const node = videoRef.current
        if (!node) return
        if (hasUserInteracted && isMuted) {
            node.muted = false
            setIsMuted(false)
        }
        const playPromise = node.play()
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {})
        }
        setIsPlaying(true)
    }

    const handleVideoPause = (event) => {
        event.preventDefault()
        event.stopPropagation()
        const node = videoRef.current
        if (!node) return
        node.pause()
        node.currentTime = 0
        setIsPlaying(false)
    }


    return (
        <Link href={`/product/${product.id}`} className='group w-full sm:w-auto mb-6'>
            <div className='bg-[#F5F5F5] h-40 w-full sm:w-60 sm:h-68 rounded-lg flex items-center justify-center overflow-hidden relative'>
                {hasVideo ? (
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        poster={posterImage || undefined}
                        className='h-full w-full group-hover:scale-105 transition duration-300 object-cover'
                        muted={isMuted}
                        playsInline
                        preload="metadata"
                        onMouseEnter={handleVideoPlay}
                        onMouseLeave={handleVideoPause}
                        onFocus={handleVideoPlay}
                        onBlur={handleVideoPause}
                    />
                ) : product.images && product.images[0] ? (
                    <Image 
                        width={500} 
                        height={500} 
                        className='max-h-30 sm:max-h-40 w-auto group-hover:scale-115 transition duration-300' 
                        src={product.images[0]} 
                        alt={product.name || "Product Image"} 
                    />
                ) : (
                    <div className="text-slate-400 text-sm">No Image</div>
                )}
                {hasVideo && (
                    <div className={`absolute bottom-2 right-2 pointer-events-none transition-opacity duration-200 ${isPlaying ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}>
                        <div className="h-8 w-8 rounded-full bg-black/60 flex items-center justify-center">
                            <svg className="h-4 w-4 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <polygon points="8,5 19,12 8,19" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>
            <div className='flex flex-col text-sm text-slate-800 pt-2 w-full sm:max-w-60'>
                {/* Product Name - wraps to 2 lines max */}
                <h3 className='font-medium line-clamp-2 min-h-[2.5rem]'>{product.name}</h3>

                {/* Price */}
                <p className='font-semibold text-base mt-2'>{currency}{product.price.toLocaleString()}</p>

                {/* Rating */}
                <div className='flex items-center gap-1 mt-2'>
                    {Array(5).fill('').map((_, index) => (
                        <StarIcon key={index} size={14} className='text-transparent' fill={rating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                    ))}
                </div>

                {/* Store Name - wraps to 1 line with ellipsis */}
                <p className='text-xs text-slate-500 mt-2 line-clamp-1'>{product.store?.name}</p>

                {/* Sold count */}
                <p className='text-xs text-slate-500 mt-1'>{product.sold || 0} sold</p>
            </div>
        </Link>
    )
}

export default ProductCard
