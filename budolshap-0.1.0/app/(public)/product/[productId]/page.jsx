'use client'
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setProduct } from "@/lib/features/product/productSlice";
import useSWR from 'swr';

export default function Product() {

    const { productId } = useParams();
    const [product, setProductState] = useState();
    const products = useSelector(state => state.product.list);
    const dispatch = useDispatch();

    // Use SWR for automatic polling (respects RealtimeProvider config)
    useSWR('/api/products', {
        revalidateOnFocus: false,  // Don't refetch when user focuses window
        revalidateOnReconnect: false,  // Don't refetch on reconnect
        dedupingInterval: 5000,  // Dedupe requests within 5 seconds
        onSuccess: (data) => {
            // Only update Redux if data actually changed (prevent unnecessary re-renders)
            if (JSON.stringify(data) !== JSON.stringify(products)) {
                dispatch(setProduct(data))
            }
        }
    })

    const fetchProduct = async () => {
        const product = products.find((product) => product.id === productId);
        setProductState(product);
    }

    useEffect(() => {
        if (products.length > 0) {
            fetchProduct()
        }
        scrollTo(0, 0)
    }, [productId, products]);

    return (
        <div className="mx-6">
            <div className="max-w-7xl mx-auto">

                {/* Breadcrums */}
                <div className="flex items-center gap-2 text-slate-500 text-sm mt-8 mb-4">
                    <Link href="/" className="hover:text-green-600 hover:underline">Home</Link>
                    <span>/</span>
                    <Link href="/shop" className="hover:text-green-600 hover:underline">Products</Link>
                    <span>/</span>
                    <Link href={`/shop?category=${product?.category}`} className="font-medium text-slate-700 hover:text-green-600 hover:underline">
                        {product?.category}
                    </Link>
                </div>

                {/* Product Details */}
                {product && (<ProductDetails product={product} />)}

                {/* Description & Reviews */}
                {product && (<ProductDescription product={product} />)}
            </div>
        </div>
    );
}