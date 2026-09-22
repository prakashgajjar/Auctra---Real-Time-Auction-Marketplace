import prisma from '../prisma/client.js';
import { hashPassword } from '../utils/hash.js';
import { generateOtp, storeOtp, setResendCooldown } from '../otp/otp.service.js';
import { sendOtpEmail } from '../mail/mail.service.js';
import { logAction } from '../audit/audit.service.js';
import { sanitizeUser } from '../utils/user.js';
import { AppError } from '../middleware/error.middleware.js';

export async function registerUser(data, { ip, userAgent } = {}) {
  const { email, username, password, firstName, lastName, phone, role } = data;

  // Check unique constraints (email, username, phone)
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
        ...(phone ? [{ phone }] : []),
      ],
    },
  });

  if (existingUser) {
    if (existingUser.email === email.toLowerCase()) {
      throw new AppError('Email is already registered', 409, 'EMAIL_EXISTS');
    }
    if (existingUser.username.toLowerCase() === username.toLowerCase()) {
      throw new AppError('Username is already taken', 409, 'USERNAME_EXISTS');
    }
    if (phone && existingUser.phone === phone) {
      throw new AppError('Phone number is already registered', 409, 'PHONE_EXISTS');
    }
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user record in PostgreSQL
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username,
      passwordHash,
      firstName,
      lastName,
      phone: phone || null,
      role: role || 'BUYER',
      status: 'PENDING_VERIFICATION',
      emailVerified: false,
    },
  });

  // Generate OTP and store with cooldown
  const otp = generateOtp();
  await storeOtp(user.email, otp);
  await setResendCooldown(user.email);

  // Fire-and-forget email and audit
  sendOtpEmail(user.email, otp);
  logAction({
    userId: user.id,
    action: 'REGISTER',
    ip,
    userAgent,
    metadata: { role: user.role },
  });

  return {
    user: sanitizeUser(user),
    message: 'Registration successful. A 6-digit verification code has been sent to your email.',
  };
}
