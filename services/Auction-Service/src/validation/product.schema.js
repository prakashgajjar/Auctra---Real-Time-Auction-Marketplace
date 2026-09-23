import { z } from 'zod';

export const createProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  categoryId: z.string().uuid('Valid Category ID is required'),
  condition: z.enum(['NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR']).default('EXCELLENT'),
  specifications: z.record(z.any()).optional().default({}),
  imageUrls: z.array(z.string().url('Invalid image URL')).min(1, 'At least 1 product image is required'),
});

export const updateProductSchema = createProductSchema.partial();

export const queryProductsSchema = z.object({
  category: z.string().optional(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR']).optional(),
  status: z.enum(['DRAFT', 'AVAILABLE', 'IN_AUCTION', 'SOLD', 'ARCHIVED']).optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'title_asc', 'title_desc']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

