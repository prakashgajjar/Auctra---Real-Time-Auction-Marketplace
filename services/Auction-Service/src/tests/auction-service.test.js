import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import prisma from '../prisma/client.js';
import { acquireLock, releaseLock, getAuctionState } from '../redis/client.js';
import { processAuctionLifecycle } from '../workers/auction-lifecycle.worker.js';

const BASE_URL = `http://localhost:${config.port}`;

function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.accessSecret,
    { expiresIn: '1h' }
  );
}

async function runTests() {
  console.log('====================================================');
  console.log('   Auctra Auction Service — Integration Test Suite   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Setup Test Users
  console.log('[Setup] Preparing test seller and buyer...');
  const testSeller = await prisma.user.upsert({
    where: { email: 'test_seller_auction@auctra.internal' },
    update: { role: 'SELLER', status: 'ACTIVE' },
    create: {
      email: 'test_seller_auction@auctra.internal',
      username: 'test_seller_auction',
      passwordHash: 'mock-hash-test',
      firstName: 'Auctra',
      lastName: 'Seller',
      role: 'SELLER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  await prisma.sellerProfile.upsert({
    where: { userId: testSeller.id },
    update: { verificationStatus: 'VERIFIED' },
    create: {
      userId: testSeller.id,
      storeName: 'Auctra Prestige Vault',
      verificationStatus: 'VERIFIED',
    },
  });

  const testBuyer = await prisma.user.upsert({
    where: { email: 'test_buyer_auction@auctra.internal' },
    update: { role: 'BUYER', status: 'ACTIVE' },
    create: {
      email: 'test_buyer_auction@auctra.internal',
      username: 'test_buyer_auction',
      passwordHash: 'mock-hash-test',
      firstName: 'Auctra',
      lastName: 'Buyer',
      role: 'BUYER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const category = await prisma.category.findFirst();
  assert(!!category, 'At least one category exists in database');

  const sellerToken = generateToken(testSeller);
  const buyerToken = generateToken(testBuyer);

  // 2. Health Check
  console.log('\n[1] Health Check');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  assert(healthRes.status === 200, `Health check HTTP 200 (Got: ${healthRes.status})`);
  assert(healthData.dependencies.postgres === 'UP', 'Postgres dependency is UP');
  assert(healthData.dependencies.redis === 'UP', 'Redis dependency is UP');

  // 3. Public Product Discovery
  console.log('\n[2] Public Product Discovery');
  const prodListRes = await fetch(`${BASE_URL}/api/v1/products?limit=5`);
  const prodListData = await prodListRes.json();
  assert(prodListRes.status === 200, `Public product listing HTTP 200 (Got: ${prodListRes.status})`);
  assert(Array.isArray(prodListData.data), 'Product list returns an array');
  const paginationMeta = prodListData.meta || prodListData.pagination;
  assert(paginationMeta && paginationMeta.page === 1, 'Pagination metadata is present and on page 1');


  // 4. Seller Product Creation
  console.log('\n[3] Seller Product Creation');
  const createProdRes = await fetch(`${BASE_URL}/api/v1/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      title: 'Automated Test Chronograph 5000',
      description: 'A masterpiece timepiece used exclusively for automated verification testing.',
      categoryId: category.id,
      condition: 'EXCELLENT',
      specifications: { movement: 'Automatic', case: 'Titanium' },
      imageUrls: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800'],
    }),
  });
  const createProdData = await createProdRes.json();
  assert(createProdRes.status === 201, `Create product HTTP 201 (Got: ${createProdRes.status})`);
  const createdProduct = createProdData.data?.product;
  assert(createdProduct && createdProduct.title.includes('Test Chronograph'), 'Created product title matches');

  // 5. Public Product Detail
  console.log('\n[4] Public Product Detail View');
  const getProdRes = await fetch(`${BASE_URL}/api/v1/products/${createdProduct.id}`);
  const getProdData = await getProdRes.json();
  assert(getProdRes.status === 200, `Public product detail HTTP 200 (Got: ${getProdRes.status})`);
  assert(getProdData.data?.product?.seller?.username === 'test_seller_auction', 'Product seller info included');

  // 6. Seller Draft Auction Creation
  console.log('\n[5] Seller Draft Auction Creation');
  const startTime = new Date(Date.now() - 60000).toISOString(); // 1 minute ago (ready for LIVE)
  const endTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour ahead
  const createAucRes = await fetch(`${BASE_URL}/api/v1/auctions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      productId: createdProduct.id,
      startingPrice: 10000,
      reservePrice: 15000,
      minIncrement: 500,
      buyNowPrice: 25000,
      startTime,
      endTime,
    }),
  });
  const createAucData = await createAucRes.json();
  assert(createAucRes.status === 201, `Create draft auction HTTP 201 (Got: ${createAucRes.status})`);
  let createdAuction = createAucData.data?.auction;
  assert(createdAuction?.status === 'DRAFT', 'Created auction status is DRAFT');

  // 7. Seller Update Draft Auction
  console.log('\n[6] Seller Update Draft Auction');
  const updateAucRes = await fetch(`${BASE_URL}/api/v1/auctions/${createdAuction.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      startingPrice: 12000,
      reservePrice: 18000,
      buyNowPrice: 30000,
    }),
  });
  const updateAucData = await updateAucRes.json();
  assert(updateAucRes.status === 200, `Update draft auction HTTP 200 (Got: ${updateAucRes.status})`);
  assert(Number(updateAucData.data?.auction?.buyNowPrice) === 30000, 'buyNowPrice updated to 30000');

  // 8. Seller Delete Draft Auction (Verify product rollback)
  console.log('\n[7] Seller Delete Draft Auction');
  const deleteAucRes = await fetch(`${BASE_URL}/api/v1/auctions/${createdAuction.id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${sellerToken}`,
    },
  });
  const deleteAucData = await deleteAucRes.json();
  assert(deleteAucRes.status === 200, `Delete draft auction HTTP 200 (Got: ${deleteAucRes.status})`);

  const productAfterDelete = await prisma.product.findUnique({ where: { id: createdProduct.id } });
  assert(productAfterDelete.status === 'AVAILABLE', 'Product status reverted to AVAILABLE after auction deletion');

  // 9. Recreate Auction & Publish
  console.log('\n[8] Recreate Auction & Publish');
  const recreateAucRes = await fetch(`${BASE_URL}/api/v1/auctions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      productId: createdProduct.id,
      startingPrice: 15000,
      reservePrice: 20000,
      minIncrement: 500,
      buyNowPrice: 35000,
      startTime: new Date(Date.now() - 60000).toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
    }),
  });
  const recreateData = await recreateAucRes.json();
  createdAuction = recreateData.data?.auction;
  assert(recreateAucRes.status === 201, 'Recreated draft auction successfully');

  const publishRes = await fetch(`${BASE_URL}/api/v1/auctions/${createdAuction.id}/publish`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${sellerToken}`,
    },
  });
  const publishData = await publishRes.json();
  assert(publishRes.status === 200, `Publish auction HTTP 200 (Got: ${publishRes.status})`);
  assert(['LIVE', 'SCHEDULED'].includes(publishData.data?.auction?.status), 'Auction status transitioned to LIVE/SCHEDULED');

  // 10. Redis Real-time State Verification
  console.log('\n[9] Redis Real-time State Verification');
  const redisState = await getAuctionState(createdAuction.id);
  assert(redisState !== null, 'Redis auction state exists');
  assert(redisState.status === publishData.data?.auction?.status, `Redis cached status matches DB status (${redisState.status})`);

  // 11. Public Auction Discovery
  console.log('\n[10] Public Auction Discovery');
  const publicAuctionsRes = await fetch(`${BASE_URL}/api/v1/auctions?status=LIVE`);
  const publicAuctionsData = await publicAuctionsRes.json();
  assert(publicAuctionsRes.status === 200, 'Public auctions listing returns HTTP 200');
  assert(Array.isArray(publicAuctionsData.data), 'Auctions data is an array');

  // 12. Instant Purchase (Buy Now)
  console.log('\n[11] Instant Purchase (Buy Now)');
  const buyNowRes = await fetch(`${BASE_URL}/api/v1/auctions/${createdAuction.id}/buy-now`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${buyerToken}`,
    },
  });
  const buyNowData = await buyNowRes.json();
  assert(buyNowRes.status === 200, `Buy Now HTTP 200 (Got: ${buyNowRes.status})`);
  assert(buyNowData.data?.auction?.status === 'SOLD', 'Auction status is now SOLD');
  assert(buyNowData.data?.auction?.winnerId === testBuyer.id, 'Auction winnerId matches testBuyer.id');
  assert(Number(buyNowData.data?.auction?.winningBid) === 35000, 'Winning bid matches Buy Now price (35000)');

  const prodAfterBuyNow = await prisma.product.findUnique({ where: { id: createdProduct.id } });
  assert(prodAfterBuyNow.status === 'SOLD', 'Product status transitioned to SOLD');

  // 13. Buyer Won Auctions Discovery
  console.log('\n[12] Buyer Won Auctions Discovery');
  const wonRes = await fetch(`${BASE_URL}/api/v1/auctions/buyer/won`, {
    headers: {
      Authorization: `Bearer ${buyerToken}`,
    },
  });
  const wonData = await wonRes.json();
  assert(wonRes.status === 200, `Buyer won auctions HTTP 200 (Got: ${wonRes.status})`);
  const wonIds = (wonData.data?.auctions || []).map((a) => a.id);
  assert(wonIds.includes(createdAuction.id), 'Purchased auction appears in buyer won list');

  // 14. Redis Distributed Lock
  console.log('\n[13] Redis Distributed Locking');
  const testLockKey = `lock:test:${Date.now()}`;
  const token = await acquireLock(testLockKey, 3000);
  assert(!!token, 'Acquired distributed lock successfully');
  const concurrentToken = await acquireLock(testLockKey, 3000);
  assert(concurrentToken === null, 'Concurrent lock acquisition correctly rejected');
  const released = await releaseLock(testLockKey, token);
  assert(released === true, 'Released distributed lock successfully');

  // 15. Lifecycle Worker Resiliency
  console.log('\n[14] Auction Lifecycle Worker Run');
  await processAuctionLifecycle();
  assert(true, 'Auction Lifecycle Worker executed cleanly');

  // Clean up test data
  console.log('\n[Cleanup] Cleaning up test entities...');
  await prisma.auction.deleteMany({ where: { productId: createdProduct.id } });
  await prisma.productImage.deleteMany({ where: { productId: createdProduct.id } });
  await prisma.product.deleteMany({ where: { id: createdProduct.id } });

  console.log('\n====================================================');
  console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .then(() => {
    console.log('✓ All integration tests passed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Integration test exception:', err);
    process.exit(1);
  });
