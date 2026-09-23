import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).optional(),
  lastName: z.string().min(1, 'Last name is required').max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format').optional().nullable(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable(),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional().nullable(),
});
