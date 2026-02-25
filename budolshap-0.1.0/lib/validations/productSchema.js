import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(5, "Product name must be at least 5 characters").max(120, "Product name limited to 120 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  categoryId: z.string().min(1, "Please select a category"),

  // Sales Info
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  mrp: z.coerce.number().min(0, "MRP cannot be negative"),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),

  // Shipping
  weight: z.coerce.number().min(0.01, "Weight is required (min 0.01 kg)"),
  length: z.coerce.number().min(0, "Length cannot be negative").optional(),
  width: z.coerce.number().min(0, "Width cannot be negative").optional(),
  height: z.coerce.number().min(0, "Height cannot be negative").optional(),

  // Others
  condition: z.enum(['New', 'Used', 'Refurbished']).default('New'),
  preOrder: z.boolean().default(false),

  // Variations
  hasVariations: z.boolean().default(false),
  parent_sku: z.string().optional(),
  tier_variations: z.array(z.any()).optional(),
  variation_matrix: z.array(z.any()).optional(),

  // Images
  images: z.array(z.any()).min(1, "At least one image is required"),
  videos: z.array(z.any()).optional()
});
