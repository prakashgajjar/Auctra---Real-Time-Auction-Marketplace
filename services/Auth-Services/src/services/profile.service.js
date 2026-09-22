import prisma from '../prisma/client.js';
import { sanitizeUser } from '../utils/user.js';
import { AppError } from '../middleware/error.middleware.js';

export async function getUserProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return sanitizeUser(user);
}

export async function updateUserProfile(userId, updateData) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return sanitizeUser(user);
}
