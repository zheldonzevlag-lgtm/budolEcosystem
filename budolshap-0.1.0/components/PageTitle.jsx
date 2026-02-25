'use client'
import { ArrowRightIcon } from 'lucide-react'
import Link from 'next/link'

const PageTitle = ({ heading, text, path = "/", linkText }) => {
    return (
        <div className="my-4 md:my-6">
            <h2 className="text-xl md:text-2xl font-bold md:font-semibold">{heading}</h2>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <p className="text-sm md:text-base text-slate-500 md:text-slate-600">{text}</p>
                <Link href={path} className="hidden md:flex items-center gap-1 text-green-500 text-[13px] md:text-sm whitespace-nowrap">
                    {linkText} <ArrowRightIcon size={14} />
                </Link>
            </div>
        </div>
    )
}

export default PageTitle