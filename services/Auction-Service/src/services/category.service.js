import prisma from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';

export async function listCategories() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          products: {
            where: {
              auction: {
                status: 'LIVE',
              },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    icon: cat.icon,
    activeAuctionCount: cat._count.products,
  }));
}

export async function getCategoryBySlug(slug) {
  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    throw new AppError('Category not found.', 404, 'CATEGORY_NOT_FOUND');
  }

  return category;
}
