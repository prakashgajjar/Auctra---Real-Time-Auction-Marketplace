import prisma from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { logUserAction, getUserAuditLogs } from '../audit/audit.service.js';

export async function listUsers({ page = 1, limit = 20, role, status, search }) {
  const skip = (page - 1) * limit;

  const where = {};

  if (role) {
    where.role = role;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        sellerProfile: {
          select: {
            storeName: true,
            verificationStatus: true,
          },
        },
      },
    }),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserDetails(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: true,
      sellerProfile: true,
    },
  });

  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  const auditLogs = await getUserAuditLogs(userId, 50);

  return {
    user,
    auditLogs,
  };
}

export async function updateUserStatus(userId, status, reason, adminContext = {}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  const previousStatus = user.status;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: {
      id: true,
      email: true,
      username: true,
      status: true,
      updatedAt: true,
    },
  });

  await logUserAction({
    userId,
    performedBy: adminContext.adminId,
    action: 'USER_STATUS_CHANGED',
    details: { previousStatus, newStatus: status, reason },
    ip: adminContext.ip,
    userAgent: adminContext.userAgent,
  });

  return updatedUser;
}

export async function updateUserRole(userId, role, reason, adminContext = {}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  const previousRole = user.role;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      updatedAt: true,
    },
  });

  await logUserAction({
    userId,
    performedBy: adminContext.adminId,
    action: 'USER_ROLE_CHANGED',
    details: { previousRole, newRole: role, reason },
    ip: adminContext.ip,
    userAgent: adminContext.userAgent,
  });

  return updatedUser;
}

export async function listSellerApplications({ page = 1, limit = 20, status = 'PENDING' }) {
  const skip = (page - 1) * limit;

  const where = status ? { verificationStatus: status } : {};

  const [total, applications] = await Promise.all([
    prisma.sellerProfile.count({ where }),
    prisma.sellerProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            emailVerified: true,
          },
        },
      },
    }),
  ]);

  return {
    applications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function reviewSellerApplication(sellerProfileId, status, rejectionReason, adminContext = {}) {
  const profile = await prisma.sellerProfile.findUnique({
    where: { id: sellerProfileId },
    include: { user: true },
  });

  if (!profile) {
    throw new AppError('Seller application profile not found.', 404, 'PROFILE_NOT_FOUND');
  }

  return prisma.$transaction(async (tx) => {
    const updatedProfile = await tx.sellerProfile.update({
      where: { id: sellerProfileId },
      data: {
        verificationStatus: status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
      },
    });

    // If verified, elevate user's role to SELLER automatically
    if (status === 'VERIFIED' && profile.user.role === 'BUYER') {
      await tx.user.update({
        where: { id: profile.userId },
        data: { role: 'SELLER' },
      });
    }

    await logUserAction({
      userId: profile.userId,
      performedBy: adminContext.adminId,
      action: status === 'VERIFIED' ? 'SELLER_APPROVED' : 'SELLER_REJECTED',
      details: {
        sellerProfileId,
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
      },
      ip: adminContext.ip,
      userAgent: adminContext.userAgent,
    });

    return updatedProfile;
  });
}
