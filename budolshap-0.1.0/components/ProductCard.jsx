import { motion, AnimatePresence } from 'framer-motion'
import { StarIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'

const ProductCard = ({ product, index = 0 }) => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const [imageLoaded, setImageLoaded] = useState(false)

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
            playPromise.catch(() => { })
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

    const hasVariations = Array.isArray(product.variation_matrix) && product.variation_matrix.length > 0
    const price = hasVariations
        ? Math.min(...product.variation_matrix.map(m => m.price))
        : (product.price || 0)

    const [showStoreTooltip, setShowStoreTooltip] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="w-full sm:w-auto"
        >
            <div className='group block'>
                <Link href={`/product/${product.id}`}>
                    <div className='bg-[#F5F5F5] h-40 w-full sm:w-60 sm:h-68 rounded-xl flex items-center justify-center overflow-hidden relative shadow-sm hover:shadow-md transition-shadow duration-300'>
                    {hasVideo ? (
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            poster={posterImage || undefined}
                            className='h-full w-full group-hover:scale-105 transition duration-500 object-cover'
                            muted={isMuted}
                            playsInline
                            autoPlay={false}
                            preload="metadata"
                            onMouseEnter={handleVideoPlay}
                            onMouseLeave={handleVideoPause}
                            onFocus={handleVideoPlay}
                            onBlur={handleVideoPause}
                        />
                    ) : product.images && product.images[0] ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: imageLoaded ? 1 : 0 }}
                                transition={{ duration: 0.4 }}
                                className="w-full h-full flex items-center justify-center"
                            >
                                <Image
                                    width={400}
                                    height={400}
                                    className='max-h-30 sm:max-h-40 w-auto group-hover:scale-110 transition duration-500 ease-out'
                                    src={product.images[0]}
                                    alt={product.name || "Product Image"}
                                    onLoad={() => setImageLoaded(true)}
                                />
                            </motion.div>
                            {!imageLoaded && (
                                <div className="absolute inset-0 bg-slate-100 animate-pulse" />
                            )}
                        </div>
                    ) : (
                        <div className="text-slate-400 text-sm flex flex-col items-center gap-2">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                                <span className="opacity-50">?</span>
                            </div>
                            No Image
                        </div>
                    )}
                    {hasVideo && (
                        <div className={`absolute bottom-3 right-3 pointer-events-none transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}>
                            <div className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                <svg className="h-5 w-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="8,5 19,12 8,19" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>
                </Link>
                <div className='flex flex-col text-sm text-slate-800 pt-3 px-1 w-full sm:max-w-60'>
                    <Link href={`/product/${product.id}`} className='group/title block'>
                        <h3 className='font-medium line-clamp-2 min-h-[2.5rem] group-hover/title:text-green-600 transition-colors duration-300'>{product.name}</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className='font-bold text-lg text-slate-900'>{currency}{price.toLocaleString()}</p>
                        </div>
                        <div className='flex items-center gap-0.5 mt-1.5'>
                            {Array(5).fill('').map((_, i) => (
                                <StarIcon key={i} size={13} className='text-transparent' fill={rating >= i + 1 ? "#00C950" : "#E2E8F0"} />
                            ))}
                            <span className="text-[10px] text-slate-400 ml-1">({ratingList.length})</span>
                        </div>
                    </Link>
                    <div className="flex items-center justify-between mt-3 gap-2">
                        <Link 
                            href={`/shop/${product.store?.username || ''}`}
                            className='flex items-center gap-1.5 flex-1 relative min-w-0 group/store hover:opacity-80 transition-opacity'
                            onMouseEnter={() => setShowStoreTooltip(true)}
                            onMouseLeave={() => setShowStoreTooltip(false)}
                        >
                            <AnimatePresence>
                                {showStoreTooltip && product.store?.name && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                        className="absolute bottom-full mb-2 left-0 z-50 pointer-events-none"
                                    >
                                        <div className="bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap font-medium">
                                            {product.store.name}
                                            <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-900" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200 group-hover/store:border-green-400 transition-colors">
                                {product.store?.logo ? (
                                    <Image
                                        src={product.store.logo.startsWith('http') || product.store.logo.startsWith('/') || product.store.logo.startsWith('data:') ? product.store.logo : `/${product.store.logo}`}
                                        alt={product.store.name || 'Store'}
                                        width={20}
                                        height={20}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <span className="text-[10px] text-slate-500 font-bold">{product.store?.name?.charAt(0) || 'B'}</span>
                                )}
                            </div>
                            <p className='text-[11px] text-slate-500 truncate group-hover/store:text-green-600 transition-colors'>{product.store?.name}</p>
                        </Link>
                        <p className='text-[11px] font-medium text-slate-400 flex-shrink-0 whitespace-nowrap'>{product.sold || 0} sold</p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default ProductCard
