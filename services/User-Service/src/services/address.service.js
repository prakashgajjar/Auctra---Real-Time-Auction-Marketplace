import prisma from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { logUserAction } from '../audit/audit.service.js';

export async function listAddresses(userId) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function createAddress(userId, addressData, context = {}) {
  // If set to default, or if this is user's first address, make it default
  const existingCount = await prisma.address.count({ where: { userId } });
  const shouldBeDefault = addressData.isDefault || existingCount === 0;

  return prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await tx.address.create({
      data: {
        ...addressData,
        userId,
        isDefault: shouldBeDefault,
      },
    });

    await logUserAction({
      userId,
      action: 'ADDRESS_CREATED',
      details: { addressId: address.id, city: address.city, isDefault: shouldBeDefault },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return address;
  });
}

export async function updateAddress(userId, addressId, addressData, context = {}) {
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!existing) {
    throw new AppError('Address not found.', 404, 'ADDRESS_NOT_FOUND');
  }

  return prisma.$transaction(async (tx) => {
    if (addressData.isDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updated = await tx.address.update({
      where: { id: addressId },
      data: addressData,
    });

    await logUserAction({
      userId,
      action: 'ADDRESS_UPDATED',
      details: { addressId },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  });
}

export async function deleteAddress(userId, addressId, context = {}) {
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!existing) {
    throw new AppError('Address not found.', 404, 'ADDRESS_NOT_FOUND');
  }

  return prisma.$transaction(async (tx) => {
    await tx.address.delete({
      where: { id: addressId },
    });

    // If the deleted address was default, make the most recent remaining one default
    if (existing.isDefault) {
      const nextAddress = await tx.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (nextAddress) {
        await tx.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    await logUserAction({
      userId,
      action: 'ADDRESS_DELETED',
      details: { addressId },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return { message: 'Address removed successfully.' };
  });
}

export async function setDefaultAddress(userId, addressId, context = {}) {
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!existing) {
    throw new AppError('Address not found.', 404, 'ADDRESS_NOT_FOUND');
  }

  return prisma.$transaction(async (tx) => {
    await tx.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    const updated = await tx.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    await logUserAction({
      userId,
      action: 'DEFAULT_ADDRESS_CHANGED',
      details: { addressId },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  });
}
