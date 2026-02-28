'use client'
import { assets } from '@/assets/assets'
import { ArrowRightIcon, ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'
import React, { useState, useEffect } from 'react'
import CategoriesSection from './CategoriesSection'

import Link from 'next/link'
import { useSelector } from 'react-redux'

import { motion } from 'framer-motion'

const Hero = () => {
    const [mounted, setMounted] = useState(false)
    const [currency, setCurrency] = useState('$')
    const products = useSelector(state => state.product?.list) || []
    const isLoading = useSelector(state => state.product?.isLoading)

    const [bestSellingProduct, setBestSellingProduct] = useState(null)
    const [maxDiscountProduct, setMaxDiscountProduct] = useState(null)
    const [maxDiscountPercentage, setMaxDiscountPercentage] = useState(0)
    const [minPrice, setMinPrice] = useState(0)

    useEffect(() => {
        setMounted(true)
        setCurrency(process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$')
    }, [])

    useEffect(() => {
        if (mounted && products.length > 0) {
            // Calculate best selling product
            const bestProduct = [...products].sort((a, b) => (b.sold || 0) - (a.sold || 0))[0]
            setBestSellingProduct(bestProduct)

            // Calculate max discount product
            const maxDiscount = [...products]
                .filter(p => p.mrp > p.price) // Only products with a discount
                .sort((a, b) => {
                    const discountA = ((a.mrp - a.price) / a.mrp) * 100
                    const discountB = ((b.mrp - b.price) / b.mrp) * 100
                    return discountB - discountA
                })[0]
            setMaxDiscountProduct(maxDiscount)

            // Calculate max discount percentage
            if (maxDiscount && maxDiscount.mrp > 0) {
                const percentage = Math.round(((maxDiscount.mrp - maxDiscount.price) / maxDiscount.mrp) * 100)
                setMaxDiscountPercentage(percentage)
            } else {
                setMaxDiscountPercentage(0)
            }

            // Calculate min price
            const validPrices = products
                .map(product => Number(product.price))
                .filter(price => price > 0);

            const min = validPrices.length > 0 ? Math.min(...validPrices) : 0;
            setMinPrice(min)
        }
    }, [mounted, products])

    return (
        <div className='mx-6'>
            <div className='flex max-xl:flex-col gap-8 max-w-7xl mx-auto mt-6 mb-12 overflow-hidden'>
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className='relative flex-1 flex flex-col bg-green-400 rounded-3xl xl:min-h-100 group'
                >
                    <div className='p-5 sm:p-16'>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className='inline-flex items-center gap-3 bg-green-300 text-green-600 pr-4 p-1 rounded-full text-xs sm:text-sm'
                        >
                            <span className='bg-green-600 px-3 py-1 max-sm:ml-1 rounded-full text-white text-xs'>NEWS</span> Free Shipping within Metro Manila for Standard shipping! <ChevronRightIcon className='group-hover:ml-2 transition-all' size={16} />
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className='text-xl sm:text-4xl xl:text-5xl leading-[1.2] my-5 font-medium bg-gradient-to-r from-slate-800 to-[#A0FF] bg-clip-text text-transparent max-w-xs  sm:max-w-md '
                        >
                            Products you'll love. Prices you'll trust. <span className='text-green-600 text-xl sm:text-4xl bg-gradient-to-r from-slate-800 to-[#A0FF] bg-clip-text text-transparent max-w-xs  sm:max-w-md '>Shipping you'll rely on.</span>
                        </motion.h2>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className='text-slate-800 text-sm font-medium mt-4 sm:mt-8'
                        >
                            <p>Starts from</p>
                            {isLoading && minPrice === 0 ? (
                                <div className="h-7 w-24 bg-green-200 animate-pulse rounded mt-1"></div>
                            ) : mounted ? (
                                <p className='text-xl'>{currency}{minPrice.toFixed(2)}</p>
                            ) : (
                                <p className='text-xl'>$0.00</p>
                            )}
                        </motion.div>
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            suppressHydrationWarning
                            className='bg-slate-800 text-white text-sm py-2 px-7 sm:py-3 sm:px-12 mt-4 sm:mt-10 rounded-md hover:bg-slate-900 hover:scale-103 active:scale-95 transition'
                        >
                            LEARN MORE
                        </motion.button>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className='sm:absolute bottom-0 right-0 md:right-10 w-full sm:max-w-sm'
                    >
                        <Image src={assets.electronics_gadget} alt="" />
                    </motion.div>
                </motion.div>
                <div className='flex flex-col md:flex-row xl:flex-col gap-5 w-full xl:max-w-sm text-sm text-slate-600'>
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex-1"
                    >
                        <Link href={mounted && bestSellingProduct ? `/product/${bestSellingProduct.id}` : '/shop'} className='flex h-full items-center justify-between w-full bg-orange-200 rounded-3xl p-6 px-8 group cursor-pointer shadow-sm hover:shadow-md transition-shadow'>
                            <div>
                                <p className='text-xl sm:text-2xl font-medium bg-gradient-to-r from-slate-800 to-[#FFAD51] bg-clip-text text-transparent max-w-40'>Best    products</p>
                                <p className='flex items-center gap-1 mt-4'>View more <ArrowRightIcon className='group-hover:ml-2 transition-all' size={18} /> </p>
                            </div>
                            {isLoading && !bestSellingProduct ? (
                                <div className='w-35 h-35 bg-orange-100/50 animate-pulse rounded-full'></div>
                            ) : (
                                <Image className='w-35 group-hover:scale-110 transition-transform duration-500' width={140} height={140} src={mounted && bestSellingProduct && ((Array.isArray(bestSellingProduct.images) && bestSellingProduct.images[0]) || (typeof bestSellingProduct.images === 'string' && bestSellingProduct.images)) ? (Array.isArray(bestSellingProduct.images) ? bestSellingProduct.images[0] : bestSellingProduct.images) : assets.hero_product_img1} alt="" />
                            )}
                        </Link>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex-1"
                    >
                        <Link href={mounted && maxDiscountProduct ? `/product/${maxDiscountProduct.id}` : '/shop'} className='flex h-full items-center justify-between w-full bg-blue-200 rounded-3xl p-6 px-8 group cursor-pointer shadow-sm hover:shadow-md transition-shadow'>
                            <div>
                                <p className='text-xl sm:text-2xl font-medium bg-gradient-to-r from-slate-800 to-[#78B2FF] bg-clip-text text-transparent max-w-40'>{mounted ? (maxDiscountPercentage || 0) : 0}% discounts</p>
                                <p className='flex items-center gap-1 mt-4'>View more <ArrowRightIcon className='group-hover:ml-2 transition-all' size={18} /> </p>
                            </div>
                            {isLoading && !maxDiscountProduct ? (
                                <div className='w-35 h-35 bg-blue-100/50 animate-pulse rounded-full'></div>
                            ) : (
                                <Image className='w-35 group-hover:scale-110 transition-transform duration-500' width={140} height={140} src={mounted && maxDiscountProduct && ((Array.isArray(maxDiscountProduct.images) && maxDiscountProduct.images[0]) || (typeof maxDiscountProduct.images === 'string' && maxDiscountProduct.images)) ? (Array.isArray(maxDiscountProduct.images) ? maxDiscountProduct.images[0] : maxDiscountProduct.images) : assets.hero_product_img2} alt="" />
                            )}
                        </Link>
                    </motion.div>
                </div>
            </div>
            <CategoriesSection />
        </div>
    )
}

export default Hero