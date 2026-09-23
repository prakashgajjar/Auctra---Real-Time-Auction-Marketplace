import prisma from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { logUserAction } from '../audit/audit.service.js';

export async function applyForSeller(userId, applicationData, context = {}) {
  const existingProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
  });

  if (existingProfile) {
    if (existingProfile.verificationStatus === 'VERIFIED') {
      throw new AppError('You are already an approved seller.', 400, 'ALREADY_SELLER');
    }
    if (existingProfile.verificationStatus === 'PENDING') {
      throw new AppError('Your seller application is already pending review.', 400, 'APPLICATION_PENDING');
    }
  }

  // Check unique store name
  const nameExists = await prisma.sellerProfile.findFirst({
    where: {
      storeName: { equals: applicationData.storeName, mode: 'insensitive' },
      userId: { not: userId },
    },
  });

  if (nameExists) {
    throw new AppError('This store name is already taken. Please choose another.', 409, 'STORE_NAME_EXISTS');
  }

  // Upsert seller profile (in case they were previously rejected and are reapplying)
  const profile = await prisma.sellerProfile.upsert({
    where: { userId },
    create: {
      ...applicationData,
      userId,
      verificationStatus: 'PENDING',
      rejectionReason: null,
    },
    update: {
      ...applicationData,
      verificationStatus: 'PENDING',
      rejectionReason: null,
    },
  });

  await logUserAction({
    userId,
    action: 'SELLER_APPLICATION_SUBMITTED',
    details: { storeName: profile.storeName, businessType: profile.businessType },
    ip: context.ip,
    userAgent: context.userAgent,
  });

  return profile;
}

export async function getSellerProfile(userId) {
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!profile) {
    throw new AppError('No seller profile found. You have not applied to become a seller yet.', 404, 'SELLER_PROFILE_NOT_FOUND');
  }

  return profile;
}

export async function updateSellerProfile(userId, updateData, context = {}) {
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new AppError('No seller profile found.', 404, 'SELLER_PROFILE_NOT_FOUND');
  }

  const updated = await prisma.sellerProfile.update({
    where: { userId },
    data: updateData,
  });

  await logUserAction({
    userId,
    action: 'SELLER_PROFILE_UPDATED',
    details: updateData,
    ip: context.ip,
    userAgent: context.userAgent,
  });

  return updated;
}

export async function getPublicStore(storeName) {
  const store = await prisma.sellerProfile.findFirst({
    where: {
      storeName: { equals: storeName, mode: 'insensitive' },
      verificationStatus: 'VERIFIED',
    },
    select: {
      id: true,
      storeName: true,
      storeDescription: true,
      businessType: true,
      ratingAverage: true,
      ratingCount: true,
      verifiedAt: true,
      createdAt: true,
      user: {
        select: {
          username: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
  });

  if (!store) {
    throw new AppError('Store not found or is not currently active.', 404, 'STORE_NOT_FOUND');
  }

  return store;
}
