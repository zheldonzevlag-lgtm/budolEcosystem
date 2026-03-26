'use client'
import BestSelling from "@/components/BestSelling";
import Hero from "@/components/Hero";
import Newsletter from "@/components/Newsletter";
import OurSpecs from "@/components/OurSpec";
import LatestProducts from "@/components/LatestProducts";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthUI } from "@/context/AuthUIContext";
import useSWR from 'swr';
import { useDispatch, useSelector } from 'react-redux';
import { setProduct, setLoading } from '@/lib/features/product/productSlice';

function AutoLoginHandler() {
    const searchParams = useSearchParams();
    const { showLogin } = useAuthUI();

    useEffect(() => {
        const shouldShowLogin = searchParams.get('showLogin');
        const redirectPath = searchParams.get('redirect');

        if (shouldShowLogin === 'true') {
            showLogin(redirectPath || null);

            // Clean up URL
            const url = new URL(window.location.href);
            url.searchParams.delete('showLogin');
            url.searchParams.delete('redirect');
            window.history.replaceState({}, '', url);
        }
    }, [searchParams, showLogin]);

    return null;
}

export default function Home() {
    const dispatch = useDispatch();
    const products = useSelector(state => state.product?.list) || [];

    // Use SWR for automatic polling (respects RealtimeProvider config)
    const { data: swrData, isLoading } = useSWR('/api/products', {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 5000
    })

    // Robust synchronization with Redux
    useEffect(() => {
        if (swrData && JSON.stringify(swrData) !== JSON.stringify(products)) {
            dispatch(setProduct(swrData))
        }
    }, [swrData, products, dispatch])

    useEffect(() => {
        dispatch(setLoading(isLoading))
    }, [isLoading, dispatch])

    return (
        <div>
            <Suspense fallback={null}>
                <AutoLoginHandler />
            </Suspense>
            <Hero />
            <LatestProducts />
            <BestSelling />
            <OurSpecs />
            <Newsletter />
        </div>
    );
}
