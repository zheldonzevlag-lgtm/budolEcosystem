'use client';

import { X, Shield, Lock, FileText, UserCheck, Eye } from 'lucide-react';

export default function PrivacyPolicyModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-99999 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-scaleIn">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Shield className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Privacy Policy</h2>
                            <p className="text-slate-500 text-sm mt-1">Republic Act No. 10173 (Data Privacy Act of 2012)</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-700"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">

                    {/* Introduction */}
                    <div className="prose prose-slate max-w-none">
                        <p className="text-slate-600 leading-relaxed">
                            At <strong><span className="font-semibold text-green-600">budol</span><span className="font-semibold text-slate-800">Shap</span></strong>, we value your privacy and are committed to protecting your personal data. This Privacy Policy outlines how we collect, use, maintain, and disclose information collected from users of our website, in compliance with the <strong>Republic Act No. 10173</strong>, also known as the <strong>Data Privacy Act of 2012</strong> of the Philippines.
                        </p>
                    </div>

                    {/* Section 1: Data Collection */}
                    <div className="border border-slate-100 rounded-xl p-6 bg-slate-50/30">
                        <div className="flex items-start gap-4">
                            <FileText className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-3">1. Collection of Personal Data</h3>
                                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                    We collect personal identification information from users in various ways, including, but not limited to, when users visit our site, register on the site, place an order, and in connection with other activities, services, features, or resources we make available on our Site. Users may be asked for, as appropriate:
                                </p>
                                <ul className="list-disc list-inside text-slate-600 text-sm space-y-1 ml-2">
                                    <li>Name</li>
                                    <li>Email address</li>
                                    <li>Mailing address</li>
                                    <li>Phone number</li>
                                    <li>Payment details</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Use of Data */}
                    <div className="border border-slate-100 rounded-xl p-6 bg-slate-50/30">
                        <div className="flex items-start gap-4">
                            <UserCheck className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-3">2. Use of Collected Information</h3>
                                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                    <span className="font-semibold text-green-600">budol</span><span className="font-semibold text-slate-800">Shap</span> collects and uses Users personal information for the following purposes:
                                </p>
                                <ul className="space-y-4 text-sm text-slate-600">
                                    <li className="flex flex-col gap-1">
                                        <span className="font-semibold text-slate-800">• To process payments:</span>
                                        <span className="pl-3">We use the information Users provide about themselves when placing an order only to provide service to that order. We do not share this information with outside parties except to the extent necessary to provide the service.</span>
                                    </li>
                                    <li className="flex flex-col gap-1">
                                        <span className="font-semibold text-slate-800">• To send periodic emails:</span>
                                        <span className="pl-3">The email address Users provide for order processing, will only be used to send them information and updates pertaining to their order, and for marketing purposes. It may also be used to respond to their inquiries, and/or other requests or questions.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Data Protection */}
                    <div className="border border-slate-100 rounded-xl p-6 bg-slate-50/30">
                        <div className="flex items-start gap-4">
                            <Lock className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-3">3. How We Protect Your Information</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    We adopt appropriate data collection, storage, and processing practices and security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information, username, password, transaction information, and data stored on our Site.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: User Rights */}
                    <div className="border border-slate-100 rounded-xl p-6 bg-slate-50/30">
                        <div className="flex items-start gap-4">
                            <Eye className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-3">4. Your Rights</h3>
                                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                    Under the Data Privacy Act of 2012, you have the following rights:
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
                                    <li className="bg-white p-3 rounded border border-slate-100">Right to be Informed</li>
                                    <li className="bg-white p-3 rounded border border-slate-100">Right to Access</li>
                                    <li className="bg-white p-3 rounded border border-slate-100">Right to Object</li>
                                    <li className="bg-white p-3 rounded border border-slate-100">Right to Erasure or Blocking</li>
                                    <li className="bg-white p-3 rounded border border-slate-100">Right to Damages</li>
                                    <li className="bg-white p-3 rounded border border-slate-100">Right to Data Portability</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="bg-green-500 rounded-xl p-6 text-white text-center">
                        <h3 className="font-bold text-lg mb-2">Have questions about your data?</h3>
                        <p className="text-white text-sm mb-4">
                            If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please contact us.
                        </p>
                        <a href="mailto:privacy@budolshap.com" className="inline-block bg-white text-slate-900 px-6 py-2 rounded-full font-medium hover:bg-slate-100 transition-colors">
                            Contact Privacy Officer
                        </a>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-between items-center">
                    <p className="text-xs text-slate-400">Last updated: December 2025</p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
}
