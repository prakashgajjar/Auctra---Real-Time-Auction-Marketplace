import { z } from 'zod';

export const createAuctionSchema = z
  .object({
    productId: z.string().uuid('Valid Product ID is required'),
    startingPrice: z.number().positive('Starting price must be greater than 0'),
    reservePrice: z.number().positive('Reserve price must be greater than 0').optional().nullable(),
    minIncrement: z.number().positive('Minimum increment must be greater than 0').default(100),
    buyNowPrice: z.number().positive('Buy now price must be greater than 0').optional().nullable(),
    startTime: z.string().datetime('Valid ISO start time is required'),
    endTime: z.string().datetime('Valid ISO end time is required'),
  })
  .refine(
    (data) => new Date(data.endTime) > new Date(data.startTime),
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  )
  .refine(
    (data) => !data.reservePrice || data.reservePrice >= data.startingPrice,
    {
      message: 'Reserve price must be greater than or equal to starting price',
      path: ['reservePrice'],
    }
  );

export const updateAuctionSchema = z
  .object({
    startingPrice: z.number().positive('Starting price must be greater than 0').optional(),
    reservePrice: z.number().positive('Reserve price must be greater than 0').optional().nullable(),
    minIncrement: z.number().positive('Minimum increment must be greater than 0').optional(),
    buyNowPrice: z.number().positive('Buy now price must be greater than 0').optional().nullable(),
    startTime: z.string().datetime('Valid ISO start time is required').optional(),
    endTime: z.string().datetime('Valid ISO end time is required').optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.endTime) > new Date(data.startTime);
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  )
  .refine(
    (data) => {
      if (data.reservePrice && data.startingPrice) {
        return data.reservePrice >= data.startingPrice;
      }
      return true;
    },
    {
      message: 'Reserve price must be greater than or equal to starting price',
      path: ['reservePrice'],
    }
  );

export const queryAuctionsSchema = z.object({
  category: z.string().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'LIVE', 'EXTENDED', 'ENDED', 'SOLD', 'UNSOLD', 'CANCELLED']).optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(['ending_soon', 'price_asc', 'price_desc', 'newest', 'popular']).default('ending_soon'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

