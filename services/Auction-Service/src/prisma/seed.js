import prisma from './client.js';

const CATEGORIES = [
  {
    name: 'Timepieces',
    slug: 'timepieces',
    icon: '⌚',
    description: 'Luxury watches, chronographs, and rare horological pieces.',
  },
  {
    name: 'Supercars',
    slug: 'supercars',
    icon: '🏎️',
    description: 'Classic sports cars, homologation specials, and racing prototypes.',
  },
  {
    name: 'Fine Art',
    slug: 'fine-art',
    icon: '🎨',
    description: 'Modern masterpieces, original canvases, and certified sculptures.',
  },
  {
    name: 'Collectibles',
    slug: 'collectibles',
    icon: '🏆',
    description: 'Historical artifacts, vintage cameras, and rare memorabilia.',
  },
  {
    name: 'Jewelry',
    slug: 'jewelry',
    icon: '💎',
    description: 'Fine estate jewelry, diamonds, and precious gemstone pieces.',
  },
  {
    name: 'Rare Spirits',
    slug: 'rare-spirits',
    icon: '🍾',
    description: 'Aged single malt scotch, vintage cognac, and collectible wines.',
  },
];

export async function seedCategories() {
  console.log('Seeding initial marketplace categories...');
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
      },
      create: cat,
    });
  }
  console.log('✓ Initial categories seeded successfully.');
}

if (process.argv[1]?.endsWith('seed.js')) {
  seedCategories()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
