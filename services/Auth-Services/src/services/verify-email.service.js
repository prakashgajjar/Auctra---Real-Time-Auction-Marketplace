import prisma from '../prisma/client.js';
import { verifyOtp } from '../otp/otp.service.js';
import { sendWelcomeEmail } from '../mail/mail.service.js';
import { logAction } from '../audit/audit.service.js';
import { createSession } from '../tokens/token.service.js';
import { sanitizeUser } from '../utils/user.js';
import { AppError } from '../middleware/error.middleware.js';

export async function verifyUserEmail({ email, otp }, { ip, userAgent } = {}) {
  const normalizedEmail = email.toLowerCase();

  // Validate OTP in Redis
  const otpResult = await verifyOtp(normalizedEmail, otp);
  if (!otpResult.success) {
    throw new AppError(otpResult.error, otpResult.tooMany ? 429 : 400, 'INVALID_OTP');
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Activate user
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      status: user.status === 'PENDING_VERIFICATION' ? 'ACTIVE' : user.status,
    },
  });

  // Welcome email
  sendWelcomeEmail(updatedUser.email, updatedUser.firstName);

  // Create session tokens
  const tokens = await createSession(updatedUser, { ip, userAgent });

  // Log action
  logAction({
    userId: updatedUser.id,
    action: 'EMAIL_VERIFIED',
    ip,
    userAgent,
  });

  return {
    user: sanitizeUser(updatedUser),
    tokens,
    message: 'Email verified successfully. Welcome to Auctra!',
  };
}
