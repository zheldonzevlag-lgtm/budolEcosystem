'use server'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { z } from 'zod'

const categorySchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    slug: z.string().min(1, 'Slug is required'),
    parentId: z.string().nullable().optional(),
    level: z.number().min(1).max(3),
    sortOrder: z.number().optional(),
    isActive: z.boolean().optional(),
    image: z.string().optional(),
    icon: z.string().optional()
})

// GET /api/admin/categories - List all categories
export async function GET(request) {
    try {
        const { authorized, errorResponse } = await requireAdmin(request)
        if (!authorized) return errorResponse

        const { searchParams } = new URL(request.url)
        const flat = searchParams.get('flat') === 'true'

        const categories = await prisma.category.findMany({
            where: {}, // Admins should see all categories (active & hidden)
            orderBy: [
                { level: 'asc' },
                { sortOrder: 'asc' },
                { name: 'asc' }
            ],
            include: {
                parent: {
                    select: {
                        id: true,
                        name: true,
                        level: true
                    }
                },
                _count: {
                    select: { products: true }
                }
            }
        })

        if (flat) {
            return NextResponse.json(categories)
        }

        // Build tree structure
        const categoryMap = new Map()
        const tree = []

        // First pass: create map of all categories
        categories.forEach(cat => {
            categoryMap.set(cat.id, { ...cat, children: [] })
        })

        // Second pass: build tree
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

// POST /api/admin/categories - Create category
export async function POST(request) {
    try {
        // Check authentication
        const { authorized, errorResponse } = await requireAdmin(request)
        if (!authorized) return errorResponse

        const body = await request.json()
        const validatedData = categorySchema.parse(body)

        // Generate slug if not provided
        if (!validatedData.slug) {
            validatedData.slug = validatedData.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
        }

        // Normalize parentId: empty string should be null
        if (validatedData.parentId === '') {
            validatedData.parentId = null
        }

        // Auto-detect level based on parent
        let level = validatedData.parentId ? validatedData.level : 1
        if (validatedData.parentId) {
            const parent = await prisma.category.findUnique({
                where: { id: validatedData.parentId }
            })
            if (parent) {
                level = parent.level + 1
                if (level > 3) {
                    return NextResponse.json(
                        { error: 'Maximum category level is 3' },
                        { status: 400 }
                    )
                }
            }
        }

        // Check for duplicate slug
        const existing = await prisma.category.findUnique({
            where: { slug: validatedData.slug }
        })
        if (existing) {
            validatedData.slug = `${validatedData.slug}-${Date.now()}`
        }

        const category = await prisma.category.create({
            data: {
                ...validatedData,
                level,
                slug: validatedData.slug
            }
        })

        return NextResponse.json(category, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }
        console.error('Error creating category:', error)
        return NextResponse.json(
            { error: 'Failed to create category' },
            { status: 500 }
        )
    }
}

// PUT /api/admin/categories - Update category
export async function PUT(request) {
    try {
        const { authorized, errorResponse } = await requireAdmin(request)
        if (!authorized) return errorResponse

        const body = await request.json()
        const { id, ...updateData } = body

        if (!id) {
            return NextResponse.json(
                { error: 'Category ID is required' },
                { status: 400 }
            )
        }

        // Validate the update data
        const validatedData = categorySchema.partial().parse(updateData)

        // Normalize parentId: empty string should be null
        if (updateData.parentId === '') {
            validatedData.parentId = null
        } else if (updateData.parentId === null) {
            validatedData.parentId = null
        }

        // Update level if parent changes
        if (validatedData.parentId === null) {
            validatedData.level = 1
        } else if (validatedData.parentId) {
            const parent = await prisma.category.findUnique({
                where: { id: validatedData.parentId }
            })
            if (parent) {
                validatedData.level = parent.level + 1
            }
        }

        const category = await prisma.category.update({
            where: { id },
            data: validatedData
        })

        return NextResponse.json(category)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }
        console.error('Error updating category:', error)
        return NextResponse.json(
            { error: 'Failed to update category' },
            { status: 500 }
        )
    }
}

// DELETE /api/admin/categories - Delete category
export async function DELETE(request) {
    try {
        const { authorized, errorResponse } = await requireAdmin(request)
        if (!authorized) return errorResponse

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'Category ID is required' },
                { status: 400 }
            )
        }

        // Check if category has children
        const children = await prisma.category.findMany({
            where: { parentId: id }
        })
        if (children.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete category with subcategories' },
                { status: 400 }
            )
        }

        // Check if category has products
        const products = await prisma.product.count({
            where: { categoryId: id }
        })
        if (products > 0) {
            // Soft delete - just mark as inactive
            await prisma.category.update({
                where: { id },
                data: { isActive: false }
            })
            return NextResponse.json({ message: 'Category deactivated (has products)' })
        }

        await prisma.category.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Category deleted' })
    } catch (error) {
        console.error('Error deleting category:', error)
        return NextResponse.json(
            { error: 'Failed to delete category' },
            { status: 500 }
        )
    }
}
