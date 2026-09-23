import { z } from 'zod';

export const createAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(100),
  phone: z.string().min(8, 'Valid phone number is required').max(20),
  streetLine1: z.string().min(3, 'Street address line 1 is required').max(255),
  streetLine2: z.string().max(255).optional().nullable(),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().min(2, 'State is required').max(100),
  postalCode: z.string().min(3, 'Postal code is required').max(20),
  country: z.string().min(2).max(50).default('IN'),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();
