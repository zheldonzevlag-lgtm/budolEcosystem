'use server'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories - Public endpoint for category tree
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const flat = searchParams.get('flat') === 'true'

        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: [
                { level: 'asc' },
                { sortOrder: 'asc' },
                { name: 'asc' }
            ],
            select: {
                id: true,
                name: true,
                slug: true,
                parentId: true,
                level: true,
                sortOrder: true
            }
        })

        if (flat) {
            return NextResponse.json(categories)
        }

        // Build tree structure
        const categoryMap = new Map()
        const tree = []

        categories.forEach(cat => {
            categoryMap.set(cat.id, { ...cat, children: [] })
        })

        categories.forEach(cat => {
            const category = categoryMap.get(cat.id)
            if (cat.parentId) {
                const parent = categoryMap.get(cat.parentId)
                if (parent) {
                    parent.children.push(category)
                }
            } else {
                tree.push(category)
            }
        })

        return NextResponse.json(tree)
    } catch (error) {
        console.error('Error fetching categories:', error)
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        )
    }
}
