'use client'

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/Loading";
import AddProductWizard from '@/components/store/add-product/AddProductWizard';
import { toast } from "react-hot-toast";

export default function StoreAddProductPage() {
    const { user, isLoading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const productId = searchParams.get('id');

    const [initialData, setInitialData] = useState(null);
    const [storeId, setStoreId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // 1. Fetch User's Store (Required for both Add & Edit)
                const storeRes = await fetch(`/api/stores/user/${user.id}`);
                if (!storeRes.ok) throw new Error("Failed to fetch store info");
                const storeData = await storeRes.json();

                if (!storeData || !storeData.id) {
                    toast.error("You need to create a store first!");
                    // TODO: Redirect to create store
                    return;
                }
                setStoreId(storeData.id);

                // 2. If Editing, Fetch Product
                if (productId) {
                    const response = await fetch(`/api/products/${productId}`);
                    if (!response.ok) throw new Error("Failed to fetch product");
                    const data = await response.json();

                    // Transform data to match schema
                    setInitialData({
                        id: data.id, // Important for Edit mode
                        name: data.name,
                        description: data.description || "",
                        category: data.category,
                        categoryId: data.categoryId, // Pass categoryId for the form
                        price: data.price,
                        mrp: data.mrp,
                        stock: data.stock,
                        weight: data.weight || 0,
                        length: data.length || 0,
                        width: data.width || 0,
                        height: data.height || 0,
                        condition: data.condition || 'New',
                        images: data.images || [],
                        videos: data.videos || [],
                        hasVariations: !!data.variation_matrix?.length,
                        tier_variations: data.tier_variations || [],
                        variation_matrix: data.variation_matrix || [],
                        parent_sku: data.parent_sku || '',
                        preOrder: data.preOrder || false // Assuming preOrder is a field
                    });
                }
            } catch (error) {
                console.error("Error loading data:", error);
                toast.error("Failed to load required data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [productId, authLoading, user]);

    if (authLoading || loading) return <Loading />;

    if (!user) {
        return <div className="p-8 text-center text-red-500">Please login to manage products.</div>;
    }

    if (!storeId && !loading) {
        return <div className="p-8 text-center text-red-500">Store not found. Please create a store first.</div>;
    }

    return (
        <div className="bg-slate-50 min-h-screen p-6">
            <div className="max-w-5xl mx-auto mb-8">
                <h1 className="text-2xl font-bold text-slate-800">
                    {productId ? 'Edit Product' : 'Add New Product'}
                </h1>
                <p className="text-slate-500">
                    {productId ? 'Update your product details and variations.' : 'Follow the steps to list your product on BudolShap.'}
                </p>
            </div>

            <AddProductWizard initialData={initialData} storeId={storeId} />
        </div>
    );
}
