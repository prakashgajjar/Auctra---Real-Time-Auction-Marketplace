import prisma from '../prisma/client.js';
import { generateOtp, storeOtp, canResendOtp, setResendCooldown, getResendCooldownRemaining } from '../otp/otp.service.js';
import { sendOtpEmail } from '../mail/mail.service.js';
import { AppError } from '../middleware/error.middleware.js';

export async function resendVerificationOtp({ email }) {
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError('User not found with this email', 404, 'USER_NOT_FOUND');
  }

  if (user.emailVerified) {
    throw new AppError('Email is already verified. You can log in directly.', 400, 'ALREADY_VERIFIED');
  }

  const canSend = await canResendOtp(normalizedEmail);
  if (!canSend) {
    const remaining = await getResendCooldownRemaining(normalizedEmail);
    throw new AppError(
      `Please wait ${remaining} seconds before requesting a new OTP.`,
      429,
      'OTP_COOLDOWN'
    );
  }

  const otp = generateOtp();
  await storeOtp(normalizedEmail, otp);
  await setResendCooldown(normalizedEmail);

  sendOtpEmail(normalizedEmail, otp);

  return {
    message: 'A new 6-digit verification code has been sent to your email.',
  };
}
