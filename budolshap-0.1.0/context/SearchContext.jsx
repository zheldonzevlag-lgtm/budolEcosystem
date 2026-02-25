'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [placeholder, setPlaceholder] = useState('Search products...');
    const pathname = usePathname();

    // Reset search query when navigating to a new page
    useEffect(() => {
        setSearchQuery('');
        
        // Default placeholders based on path
        if (pathname.includes('/store/orders')) {
            setPlaceholder('Search store orders...');
        } else if (pathname.includes('/admin/orders')) {
            setPlaceholder('Search all orders...');
        } else if (pathname.includes('/admin/products')) {
            setPlaceholder('Search all products...');
        } else if (pathname.includes('/admin/users')) {
            setPlaceholder('Search users...');
        } else if (pathname.includes('/admin/stores')) {
            setPlaceholder('Search stores...');
        } else if (pathname.includes('/admin/returns')) {
            setPlaceholder('Search returns...');
        } else if (pathname.includes('/admin/coupons')) {
            setPlaceholder('Search coupons...');
        } else if (pathname.includes('/admin/payouts')) {
            setPlaceholder('Search payouts...');
        } else if (pathname.includes('/admin/approve')) {
            setPlaceholder('Search pending stores...');
        } else if (pathname.includes('/admin/memberships')) {
            setPlaceholder('Search membership apps...');
        } else if (pathname.includes('/orders')) {
            setPlaceholder('Search your orders...');
        } else if (pathname.includes('/shop')) {
            setPlaceholder('Search products...');
        } else {
            setPlaceholder('Search products...');
        }
    }, [pathname]);

    const updateSearchQuery = useCallback((query) => {
        setSearchQuery(query);
    }, []);

    const updatePlaceholder = useCallback((newPlaceholder) => {
        setPlaceholder(newPlaceholder);
    }, []);

    return (
        <SearchContext.Provider value={{ 
            searchQuery, 
            updateSearchQuery, 
            placeholder, 
            updatePlaceholder 
        }}>
            {children}
        </SearchContext.Provider>
    );
};

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
};
