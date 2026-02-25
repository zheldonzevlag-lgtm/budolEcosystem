'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'

const Breadcrumb = () => {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const productId = searchParams.get('id')
    
    // Split pathname and filter out empty strings
    const pathSegments = pathname.split('/').filter(segment => segment !== '')
    
    // Map of segments to readable names
    const segmentMap = {
        'store': 'Dashboard',
        'add-product': productId ? 'Edit Product' : 'Add Product',
        'manage-product': 'Manage Product',
        'orders': 'Orders',
        'shipping': 'Shipping',
        'coupons': 'Coupons',
        'wallet': 'Wallet',
        'returns': 'Returns',
        'chat': 'Chat',
        'settings': 'Settings'
    }

    // Custom breadcrumb generation for hierarchical paths that aren't strictly in the URL
    const getBreadcrumbs = () => {
        const breadcrumbs = [];
        
        pathSegments.forEach((segment, index) => {
            if (segment === 'store') return;

            // If we are on add-product, inject Manage Products before it
            if (segment === 'add-product') {
                breadcrumbs.push({
                    label: segmentMap['manage-product'],
                    path: '/store/manage-product',
                    isLast: false
                });
            }

            const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
            const isLast = index === pathSegments.length - 1;
            
            // For add-product, we use the mapped label which accounts for Edit vs Add
            const label = segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

            breadcrumbs.push({
                label,
                path: productId ? `${path}?id=${productId}` : path,
                isLast
            });
        });
        
        return breadcrumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    // Don't show breadcrumb if it's just the root dashboard
    if (pathSegments.length <= 1 && pathSegments[0] === 'store') {
        return null
    }

    return (
        <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-6 overflow-x-auto no-scrollbar whitespace-nowrap pb-2">
            <Link 
                href="/store" 
                className="flex items-center gap-1 hover:text-slate-800 transition-colors"
            >
                <Home size={14} />
                <span>Dashboard</span>
            </Link>

            {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path + index} className="flex items-center space-x-2">
                    <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
                    {crumb.isLast ? (
                        <span className="font-medium text-slate-800">{crumb.label}</span>
                    ) : (
                        <Link 
                            href={crumb.path}
                            className="hover:text-slate-800 transition-colors"
                        >
                            {crumb.label}
                        </Link>
                    )}
                </div>
            ))}
        </nav>
    )
}

export default Breadcrumb
