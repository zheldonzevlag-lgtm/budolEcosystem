'use client'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export const Skeleton = ({ className, ...props }) => {
    return (
        <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            className={cn("bg-slate-200 rounded-md", className)}
            {...props}
        />
    )
}

export const ProductSkeleton = () => {
    return (
        <div className='w-full sm:w-60 mb-6'>
            <Skeleton className="h-40 w-full sm:h-68 rounded-lg" />
            <div className='flex flex-col pt-2 w-full sm:max-w-60 gap-2'>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-6 w-1/3 mt-2" />
                <div className='flex gap-1 mt-2'>
                    {Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-3.5 w-3.5 rounded-full" />
                    ))}
                </div>
                <Skeleton className="h-3 w-1/2 mt-2" />
                <Skeleton className="h-3 w-1/4 mt-1" />
            </div>
        </div>
    )
}
