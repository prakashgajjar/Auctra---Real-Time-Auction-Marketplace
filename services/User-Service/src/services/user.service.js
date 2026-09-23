import prisma from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { logUserAction } from '../audit/audit.service.js';

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      bio: true,
      role: true,
      status: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: true,
      updatedAt: true,
      addresses: {
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      },
      sellerProfile: {
        select: {
          id: true,
          storeName: true,
          storeDescription: true,
          businessType: true,
          verificationStatus: true,
          ratingAverage: true,
          ratingCount: true,
          verifiedAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  return user;
}

export async function updateMe(userId, updateData, context = {}) {
  // If phone is being updated, check uniqueness
  if (updateData.phone) {
    const existingPhone = await prisma.user.findFirst({
      where: {
        phone: updateData.phone,
        id: { not: userId },
      },
    });

    if (existingPhone) {
      throw new AppError('This phone number is already registered to another account.', 409, 'PHONE_EXISTS');
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...updateData,
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      bio: true,
      role: true,
      status: true,
      emailVerified: true,
      phoneVerified: true,
      updatedAt: true,
    },
  });

  await logUserAction({
    userId,
    action: 'PROFILE_UPDATED',
    details: { fields: Object.keys(updateData) },
    ip: context.ip,
    userAgent: context.userAgent,
  });

  return updatedUser;
}

export async function getPublicProfile(userIdOrUsername) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdOrUsername);

  const user = await prisma.user.findFirst({
    where: isUuid ? { id: userIdOrUsername } : { username: userIdOrUsername },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      bio: true,
      role: true,
      createdAt: true,
      sellerProfile: {
        select: {
          storeName: true,
          storeDescription: true,
          ratingAverage: true,
          ratingCount: true,
          verificationStatus: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User profile not found.', 404, 'PROFILE_NOT_FOUND');
  }

  return user;
}
