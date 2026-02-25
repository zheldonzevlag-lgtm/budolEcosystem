'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronUp, UserPlus, Store, ShoppingBag, CreditCard, HelpCircle } from 'lucide-react';

const faqData = [
    {
        category: "Getting Started",
        icon: <UserPlus className="w-5 h-5 text-blue-500" />,
        items: [
            {
                question: "How to create an account?",
                answer: (<span>To create an account, click on the 'Sign Up' button at the top right corner of the homepage. Fill in your details including your name, email, and password. Verify your email address to complete the registration process. <span className='text-blue-500'>If you don't want to create a test account you can use <span className='font-bold text-green-500'>jon.galvez@budolshap.com</span> as your email and <span className='font-bold text-green-500'>budolshap</span> as your password.</span></span>)
            },
            {
                question: "How to become a seller?",
                answer: (<span>Once you have created a user account, go to your profile settings and look for the 'Become a Seller' option. You will need to provide additional information such as your business details and valid identification. After submission, your application will be reviewed. <span className='text-blue-500'>If you don't want to create a test account you can use <span className='font-bold text-green-500'>tony.stark@budolshap.com</span> as your email and <span className='font-bold text-green-500'>budolshap</span> as your password.</span></span>)
            }
        ]
    },
    {
        category: "Store Management",
        icon: <Store className="w-5 h-5 text-purple-500" />,
        items: [
            {
                question: "How to create a store?",
                answer: "After being approved as a seller, navigate to the 'Seller Dashboard'. Click on 'Create Store', upload your store logo, banner, and fill in your store description and policies."
            },
            {
                question: "How to manage products?",
                answer: "In your Seller Dashboard, go to the 'Products' tab. Here you can add new products, edit existing ones, update prices, manage inventory, and delete products. Make sure to add high-quality images and detailed descriptions."
            }
        ]
    },
    {
        category: "Shopping",
        icon: <ShoppingBag className="w-5 h-5 text-green-500" />,
        items: [
            {
                question: "How to shop?",
                answer: "Browse through our categories or use the search bar to find products. You can filter results by price, category, and rating to find exactly what you need."
            },
            {
                question: "How to add product to cart?",
                answer: "When you find a product you like, click on it to view details. Select your desired variation (if any) and quantity, then click the 'Add to Cart' button. You can continue shopping or proceed to checkout."
            },
            {
                question: "How to view product details?",
                answer: "Click on any product image or title to visit the product detail page. Here you can see full specifications, customer reviews, seller information, and related products."
            }
        ]
    },
    {
        category: "Orders & Payment",
        icon: <CreditCard className="w-5 h-5 text-orange-500" />,
        items: [
            {
                question: "Payment methods",
                answer: "We accept various payment methods including Credit/Debit cards, GCash (via PayMongo), and Cash on Delivery (COD) for eligible areas."
            },
            {
                question: "How to view orders?",
                answer: "Log in to your account and go to 'My Orders'. You will see a list of all your current and past orders with their status."
            },
            {
                question: "How to track orders?",
                answer: "In 'My Orders', click on the specific order you want to track. You will see the delivery status updates. For Lalamove deliveries, real-time tracking might be available."
            }
        ]
    },
    {
        category: "Others",
        icon: <HelpCircle className="w-5 h-5 text-gray-500" />,
        items: [
            {
                question: "Other helpful information",
                answer: "For any other concerns, you can reach out to reynaldomgalvez@gmail.com."
            }
        ]
    }
];

export default function HowToGuide({ isOpen, onClose }) {
    const [openCategory, setOpenCategory] = useState(null);
    const [openQuestion, setOpenQuestion] = useState(null);

    if (!isOpen) return null;

    const toggleCategory = (index) => {
        setOpenCategory(openCategory === index ? null : index);
        setOpenQuestion(null); // Reset open question when switching categories
    };

    const toggleQuestion = (catIndex, qIndex) => {
        const key = `${catIndex}-${qIndex}`;
        setOpenQuestion(openQuestion === key ? null : key);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-scaleIn">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">How To Guide</h2>
                        <p className="text-slate-500 text-sm mt-1">Everything you need to know about BudolShap</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-700"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {faqData.map((category, catIndex) => (
                        <div key={catIndex} className="border border-slate-200 rounded-xl overflow-hidden">
                            <button
                                onClick={() => toggleCategory(catIndex)}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    {category.icon}
                                    <span className="font-semibold text-slate-700">{category.category}</span>
                                </div>
                                {openCategory === catIndex ? (
                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                )}
                            </button>

                            {openCategory === catIndex && (
                                <div className="bg-white divide-y divide-slate-100">
                                    {category.items.map((item, qIndex) => (
                                        <div key={qIndex} className="group">
                                            <button
                                                onClick={() => toggleQuestion(catIndex, qIndex)}
                                                className="w-full flex items-start justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                                            >
                                                <span className="font-medium text-slate-600 text-sm pr-4 group-hover:text-slate-900">
                                                    {item.question}
                                                </span>
                                                {openQuestion === `${catIndex}-${qIndex}` ? (
                                                    <ChevronUp className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                                )}
                                            </button>

                                            {openQuestion === `${catIndex}-${qIndex}` && (
                                                <div className="px-4 pb-4 text-sm text-slate-500 leading-relaxed animate-fadeIn">
                                                    {item.answer}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
                    >
                        Close Guide
                    </button>
                </div>
            </div>
        </div>
    );
}
