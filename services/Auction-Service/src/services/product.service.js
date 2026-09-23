import prisma from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';

export async function createProduct(sellerId, data) {
  const { title, description, categoryId, condition, specifications, imageUrls } = data;

  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new AppError('Specified category does not exist.', 404, 'CATEGORY_NOT_FOUND');
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        sellerId,
        categoryId,
        title,
        description,
        condition,
        specifications: specifications || {},
        status: 'AVAILABLE',
      },
    });

    if (imageUrls && imageUrls.length > 0) {
      await tx.productImage.createMany({
        data: imageUrls.map((url, idx) => ({
          productId: product.id,
          url,
          isPrimary: idx === 0,
          sortOrder: idx,
        })),
      });
    }

    return tx.product.findUnique({
      where: { id: product.id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
      },
    });
  });
}

export async function listSellerProducts(sellerId) {
  return prisma.product.findMany({
    where: { sellerId },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      category: true,
      auction: {
        select: {
          id: true,
          status: true,
          currentHighestBid: true,
          startTime: true,
          endTime: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listPublicProducts(query) {
  const {
    category,
    condition,
    status,
    search,
    sort = 'newest',
    page = 1,
    limit = 20,
  } = query;

  const skip = (page - 1) * limit;
  const where = {};

  if (status) {
    where.status = status;
  }

  if (condition) {
    where.condition = condition;
  }

  if (category) {
    where.category = {
      OR: [
        { slug: { equals: category, mode: 'insensitive' } },
        { name: { equals: category, mode: 'insensitive' } },
      ],
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  let orderBy = { createdAt: 'desc' };
  if (sort === 'title_asc') orderBy = { title: 'asc' };
  if (sort === 'title_desc') orderBy = { title: 'desc' };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        seller: {
          select: {
            id: true,
            username: true,
            sellerProfile: {
              select: {
                storeName: true,
                ratingAverage: true,
                verificationStatus: true,
              },
            },
          },
        },
        auction: {
          select: {
            id: true,
            status: true,
            startingPrice: true,
            currentHighestBid: true,
            buyNowPrice: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    }),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProductById(productId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      category: true,
      seller: {
        select: {
          id: true,
          username: true,
          sellerProfile: {
            select: {
              storeName: true,
              ratingAverage: true,
              verificationStatus: true,
            },
          },
        },
      },
      auction: true,
    },
  });

  if (!product) {
    throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }

  return product;
}


export async function updateProduct(sellerId, productId, updateData) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { auction: true },
  });

  if (!product) {
    throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }

  if (product.sellerId !== sellerId) {
    throw new AppError('You do not have permission to modify this product.', 403, 'FORBIDDEN');
  }

  if (product.auction && ['LIVE', 'EXTENDED', 'ENDED', 'SOLD'].includes(product.auction.status)) {
    throw new AppError(
      `Cannot edit product while it is associated with a ${product.auction.status.toLowerCase()} auction.`,
      400,
      'PRODUCT_LOCKED'
    );
  }

  const { imageUrls, ...directFields } = updateData;

  return prisma.$transaction(async (tx) => {
    if (imageUrls && imageUrls.length > 0) {
      await tx.productImage.deleteMany({ where: { productId } });
      await tx.productImage.createMany({
        data: imageUrls.map((url, idx) => ({
          productId,
          url,
          isPrimary: idx === 0,
          sortOrder: idx,
        })),
      });
    }

    return tx.product.update({
      where: { id: productId },
      data: directFields,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
      },
    });
  });
}

export async function deleteProduct(sellerId, productId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { auction: true },
  });

  if (!product) {
    throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }

  if (product.sellerId !== sellerId) {
    throw new AppError('You do not have permission to delete this product.', 403, 'FORBIDDEN');
  }

  if (product.auction && product.auction.status !== 'DRAFT' && product.auction.status !== 'CANCELLED') {
    throw new AppError('Cannot delete a product with an active or completed auction.', 400, 'PRODUCT_LOCKED');
  }

  await prisma.product.delete({
    where: { id: productId },
  });

  return { message: 'Product deleted successfully.' };
}
