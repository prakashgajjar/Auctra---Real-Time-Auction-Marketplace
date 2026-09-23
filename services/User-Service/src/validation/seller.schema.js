import { z } from 'zod';

export const applySellerSchema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters').max(100),
  storeDescription: z.string().max(1000).optional().nullable(),
  businessType: z.enum(['INDIVIDUAL', 'REGISTERED_BUSINESS']).default('INDIVIDUAL'),
  taxId: z.string().min(5, 'Valid tax ID / PAN / GSTIN is required').max(50),
  bankAccountNumber: z.string().min(8, 'Bank account number is required').max(50),
  bankIfsc: z.string().min(4, 'Bank IFSC/Routing number is required').max(50),
});

export const updateSellerProfileSchema = z.object({
  storeDescription: z.string().max(1000).optional().nullable(),
  businessType: z.enum(['INDIVIDUAL', 'REGISTERED_BUSINESS']).optional(),
});
