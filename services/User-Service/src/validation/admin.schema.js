import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  status: z.enum([
    'PENDING_VERIFICATION',
    'ACTIVE',
    'SUSPENDED',
    'DEACTIVATED',
    'BANNED',
    'DELETED',
  ]),
  reason: z.string().min(3, 'A reason for status change must be provided').max(500),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['BUYER', 'SELLER', 'ADMIN', 'MODERATOR']),
  reason: z.string().min(3, 'A reason for role change must be provided').max(500),
});

export const reviewSellerApplicationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  rejectionReason: z.string().max(500).optional().nullable(),
});
