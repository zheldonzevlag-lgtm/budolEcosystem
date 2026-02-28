'use client'
import React from 'react'
import Title from './Title'
import ProductCard from './ProductCard'
import { useSelector } from 'react-redux'
import { ProductSkeleton } from './ui/Skeleton'

const LatestProducts = () => {

    const displayQuantity = 4
    const products = useSelector(state => state.product?.list) || []
    const loading = useSelector(state => state.product?.loading)

    return (
        <div className='px-6 mb-section-y max-w-6xl mx-auto'>
            <Title title='Latest Products' description={`Showing ${products.length < displayQuantity ? (loading ? displayQuantity : products.length) : displayQuantity} of ${loading ? '...' : products.length} products`} href='/shop' />
            <div className='mt-12 grid grid-cols-2 sm:flex flex-wrap gap-6 justify-between'>
                {loading ? (
                    Array(displayQuantity).fill(0).map((_, i) => (
                        <ProductSkeleton key={i} />
                    ))
                ) : (
                    products.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, displayQuantity).map((product, index) => (
                        <ProductCard key={product.id || index} product={product} index={index} />
                    ))
                )}
            </div>
        </div>
    )
}

export default LatestProducts