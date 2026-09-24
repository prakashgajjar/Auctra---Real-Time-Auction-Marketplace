import { z } from 'zod';

const NotificationTypeEnum = z.enum([
  'AUCTION_WON',
  'AUCTION_OUTBID',
  'AUCTION_ENDED_PARTICIPANT',
  'AUCTION_BID_PLACED',
  'SYSTEM',
  'AUCTION_STARTED',
  'AUCTION_ENDING_SOON',
  'PAYMENT_SUCCESSFUL',
  'ORDER_SHIPPED',
  'PAYMENT_PENDING',
  'PAYMENT_REFUNDED',
]);

const UserRoleEnum = z.enum(['BUYER', 'SELLER', 'ADMIN', 'MODERATOR']);

export const getNotificationsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
  isRead: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  type: NotificationTypeEnum.optional(),
});

export const sendNotificationSchema = z.object({
  userId: z.string().uuid({ message: 'Valid userId UUID is required' }),
  type: NotificationTypeEnum.default('SYSTEM'),
  title: z.string().min(1, 'Title is required').max(255),
  message: z.string().min(1, 'Message is required'),
  data: z.record(z.any()).optional().default({}),
  channels: z
    .array(z.enum(['IN_APP', 'EMAIL', 'WEBSOCKET']))
    .optional()
    .default(['IN_APP', 'EMAIL', 'WEBSOCKET']),
  emailPayload: z.record(z.any()).optional(),
});

export const broadcastNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  message: z.string().min(1, 'Message is required'),
  type: NotificationTypeEnum.default('SYSTEM'),
  data: z.record(z.any()).optional().default({}),
  targetRole: UserRoleEnum.optional(),
});

export const updatePreferencesSchema = z.object({
  email: z
    .object({
      outbid: z.boolean().optional(),
      auctionWon: z.boolean().optional(),
      auctionStarted: z.boolean().optional(),
      endingSoon: z.boolean().optional(),
      payment: z.boolean().optional(),
      orderShipped: z.boolean().optional(),
      system: z.boolean().optional(),
    })
    .optional(),
  inApp: z
    .object({
      outbid: z.boolean().optional(),
      auctionWon: z.boolean().optional(),
      auctionStarted: z.boolean().optional(),
      endingSoon: z.boolean().optional(),
      bidPlaced: z.boolean().optional(),
      payment: z.boolean().optional(),
      orderShipped: z.boolean().optional(),
      system: z.boolean().optional(),
    })
    .optional(),
});

export const dlqQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
});
