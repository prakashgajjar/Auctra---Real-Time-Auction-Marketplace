import { z } from 'zod';

export const placeBidSchema = z.object({
  auctionId: z.string().uuid('Valid Auction ID is required'),
  amount: z.number().positive('Bid amount must be a positive number'),
  idempotencyKey: z.string().max(100).optional(),
});

export const autoBidSchema = z.object({
  auctionId: z.string().uuid('Valid Auction ID is required'),
  maxBudget: z.number().positive('Maximum budget must be greater than zero'),
});

export const queryBidsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
