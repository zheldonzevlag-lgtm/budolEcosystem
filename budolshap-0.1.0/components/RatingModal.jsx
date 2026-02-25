'use client'

import { Star } from 'lucide-react';
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom';
import { XIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUser } from '@/lib/auth-client';
import { useDispatch } from 'react-redux';
import { addRating } from '@/lib/features/rating/ratingSlice';

const RatingModal = ({ ratingModal, setRatingModal }) => {

    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const dispatch = useDispatch();

    // Ensure we only render on client-side
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleSubmit = async () => {
        if (rating < 1 || rating > 5) {
            toast.error('Please select a rating');
            return;
        }
        if (review.length < 5) {
            toast.error('Please write a short review (at least 5 characters)');
            return;
        }

        const user = getUser();
        if (!user) {
            toast.error('You must be logged in to submit a rating');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/ratings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    productId: ratingModal.productId,
                    orderId: ratingModal.orderId,
                    rating,
                    review
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Rating submitted successfully!');
                // Add rating to Redux store
                dispatch(addRating(data));
                setRatingModal(null);
            } else {
                toast.error(data.error || 'Failed to submit rating');
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            toast.error('Failed to submit rating. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    // Don't render until mounted (client-side only)
    if (!mounted) return null;

    const modalContent = (
        <div
            className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]'
            onClick={(e) => {
                // Only close if clicking the backdrop itself, not the modal content
                if (e.target === e.currentTarget) {
                    setRatingModal(null);
                }
            }}
        >
            <div
                className='bg-white p-6 sm:p-8 rounded-lg shadow-2xl w-full max-w-sm mx-4 relative animate-[scaleIn_0.3s_ease-out]'
                onClick={(e) => {
                    // Prevent all clicks inside the modal from propagating
                    e.stopPropagation();
                }}
            >
                <button
                    onClick={() => setRatingModal(null)}
                    className='absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition-colors'
                    disabled={isSubmitting}
                >
                    <XIcon size={20} />
                </button>
                <h2 className='text-2xl font-semibold text-slate-700 mb-6'>Rate Product</h2>
                <div className='flex items-center justify-center mb-6 gap-2'>
                    {Array.from({ length: 5 }, (_, i) => (
                        <Star
                            key={i}
                            className={`size-10 cursor-pointer transition-all ${rating > i
                                ? "text-yellow-400 fill-yellow-400 scale-110"
                                : "text-gray-300 hover:text-yellow-200"
                                }`}
                            onClick={() => !isSubmitting && setRating(i + 1)}
                        />
                    ))}
                </div>
                {rating > 0 && (
                    <p className='text-center text-sm text-slate-500 mb-4'>
                        {rating === 1 && '⭐ Poor'}
                        {rating === 2 && '⭐⭐ Fair'}
                        {rating === 3 && '⭐⭐⭐ Good'}
                        {rating === 4 && '⭐⭐⭐⭐ Very Good'}
                        {rating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
                    </p>
                )}
                <textarea
                    className='w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all'
                    placeholder='Share your experience with this product...'
                    rows='4'
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    disabled={isSubmitting}
                ></textarea>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || rating === 0}
                    className='w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2'
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Submitting...
                        </>
                    ) : (
                        'Submit Rating'
                    )}
                </button>
            </div>
        </div>
    );

    // Render modal using portal to document.body
    return createPortal(modalContent, document.body);
}

export default RatingModal