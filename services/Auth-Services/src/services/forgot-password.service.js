import prisma from '../prisma/client.js';
import { generateOtp, storeOtp } from '../otp/otp.service.js';
import { sendOtpEmail } from '../mail/mail.service.js';
import { logAction } from '../audit/audit.service.js';

export async function forgotPasswordRequest({ email }, { ip, userAgent } = {}) {
  const normalizedEmail = email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Always return identical message to prevent user enumeration
  if (user) {
    const otp = generateOtp();
    await storeOtp(`pwd:${normalizedEmail}`, otp);
    sendOtpEmail(normalizedEmail, otp);

    logAction({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      ip,
      userAgent,
    });
  }

  return {
    message: 'If an account exists with this email address, a password reset code has been sent.',
  };
}
