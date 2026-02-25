'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShoppingBag, Mail, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import HowToGuide from '@/components/HowToGuide';

export default function UnderConstruction() {
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">

            {/* Abstract Background Shapes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-green-200/40 to-emerald-200/40 blur-3xl animate-blob"></div>
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-blue-200/40 to-indigo-200/40 blur-3xl animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-purple-200/40 to-pink-200/40 blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            <div className="max-w-4xl w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 text-center relative z-10 border border-white/50">
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 blur-xl opacity-20 rounded-full animate-pulse"></div>
                        <a
                            href="https://www.youtube.com/shorts/YiD7bPjuMKY"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                        >
                            <div className="p-5 rounded-2xl shadow-lg relative transform hover:scale-110 transition-transform duration-300 cursor-pointer">
                                <Image
                                    src="/boxing-glove-muay-thai.png"
                                    alt="Boxing Gloves"
                                    width={96}
                                    height={96}
                                    className="rounded-xl"
                                />
                            </div>
                        </a>
                    </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 tracking-tight">
                    Under <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">Development</span>
                </h1>

                <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto">
                    I'm building something amazing! This platform is currently being crafted with care to bring you the best shopping experience. I am working hard to bring new features and improvements. In the meantime, feel free to explore other sections of the site, or if you have any questions, you can reach out to me at reynaldomgalvez@gmail.com
                </p>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto">
                    Your suggestions are always welcome!<span className="text-blue-600 font-bold"> ALL PURCHASES FOR NOW IS IN A SANDBOX (budolPay, Gcash, Maya, GrabPay via PAYMONGO & LALAMOVE) ENVIRONMENT ONLY, NO REAL CHARGES WILL BE MADE <span className="text-blue-600 font-bold">EXCEPT FOR THE PAYMENT VIA QRPH. IF YOU SCAN THE QRPH QRCODE, JUST CANCEL THE PAYMENT.</span></span>.
                    This site uses free resources (Hosting, Domain Name) and services to keep it running. Expect that this site will slow down a bit.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                    <a
                        href="https://www.youtube.com/watch?v=hWRRdICvMNs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-green-200 hover:shadow-md transition-all group cursor-pointer block"
                    >
                        <ShoppingBag className="w-6 h-6 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
                        <h3 className="font-semibold text-slate-800">New Features</h3>
                        <p className="text-sm text-slate-500">Exciting shopping tools coming soon</p>
                    </a>

                    <div
                        onClick={() => setIsGuideOpen(true)}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all group cursor-pointer"
                    >
                        <HelpCircle className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                        <h3 className="font-semibold text-slate-800">How to Guide</h3>
                        <p className="text-sm text-slate-500">Learn how to use the platform</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group">
                        <a
                            href="https://www.youtube.com/watch?v=OAdOa31EH4o"
                            target="_blank"
                            rel="noopener noreferrer"

                        >
                            <Mail className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                            <h3 className="font-semibold text-slate-800">Get Notified</h3>
                            <p className="text-sm text-slate-500">Stay tuned for updates</p>
                        </a>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <Link
                        href="/shop"
                        className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-slate-700 border border-slate-200 rounded-full font-medium hover:bg-slate-50 transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>

            <HowToGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
        </div>
    );
}
