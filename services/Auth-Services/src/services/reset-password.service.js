import prisma from '../prisma/client.js';
import { verifyOtp } from '../otp/otp.service.js';
import { hashPassword } from '../utils/hash.js';
import { revokeAllUserTokens } from '../tokens/token.service.js';
import { logAction } from '../audit/audit.service.js';
import { AppError } from '../middleware/error.middleware.js';

export async function resetPasswordWithOtp({ email, otp, newPassword }, { ip, userAgent } = {}) {
  const normalizedEmail = email.toLowerCase();

  const otpResult = await verifyOtp(`pwd:${normalizedEmail}`, otp);
  if (!otpResult.success) {
    throw new AppError(otpResult.error, otpResult.tooMany ? 429 : 400, 'INVALID_OTP');
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const newHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  // Invalidate all existing sessions on password reset
  await revokeAllUserTokens(user.id);

  logAction({
    userId: user.id,
    action: 'PASSWORD_RESET',
    ip,
    userAgent,
  });

  return {
    message: 'Password has been reset successfully. Please log in with your new password.',
  };
}
