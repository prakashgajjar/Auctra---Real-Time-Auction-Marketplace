import { z } from 'zod';

const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores'),
  password: passwordValidation,
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  phone: z.string().trim().optional().nullable(),
  role: z.enum(['BUYER', 'SELLER']).default('BUYER'),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  otp: z.string().trim().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must consist of digits only'),
});

export const resendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  otp: z.string().trim().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must consist of digits only'),
  newPassword: passwordValidation,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordValidation,
});

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  phone: z.string().trim().optional().nullable(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable(),
});
