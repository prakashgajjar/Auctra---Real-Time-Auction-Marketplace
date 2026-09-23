import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import prisma from '../prisma/client.js';
import { getAuctionState } from '../redis/client.js';

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
  console.log('     Auctra Bid Service — Integration Test Suite    ');
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
  console.log('[Setup] Preparing test users and live auction...');
  const testSeller = await prisma.user.upsert({
    where: { email: 'bid_test_seller@auctra.internal' },
    update: { role: 'SELLER', status: 'ACTIVE' },
    create: {
      email: 'bid_test_seller@auctra.internal',
      username: 'bid_test_seller',
      passwordHash: 'mock-hash',
      firstName: 'Seller',
      lastName: 'BidTest',
      role: 'SELLER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const buyerA = await prisma.user.upsert({
    where: { email: 'buyer_a@auctra.internal' },
    update: { role: 'BUYER', status: 'ACTIVE' },
    create: {
      email: 'buyer_a@auctra.internal',
      username: 'buyer_alpha',
      passwordHash: 'mock-hash',
      firstName: 'Alpha',
      lastName: 'Buyer',
      role: 'BUYER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const buyerB = await prisma.user.upsert({
    where: { email: 'buyer_b@auctra.internal' },
    update: { role: 'BUYER', status: 'ACTIVE' },
    create: {
      email: 'buyer_b@auctra.internal',
      username: 'buyer_bravo',
      passwordHash: 'mock-hash',
      firstName: 'Bravo',
      lastName: 'Buyer',
      role: 'BUYER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const buyerC = await prisma.user.upsert({
    where: { email: 'buyer_c@auctra.internal' },
    update: { role: 'BUYER', status: 'ACTIVE' },
    create: {
      email: 'buyer_c@auctra.internal',
      username: 'buyer_charlie',
      passwordHash: 'mock-hash',
      firstName: 'Charlie',
      lastName: 'Buyer',
      role: 'BUYER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const category = await prisma.category.findFirst();
  assert(!!category, 'At least one category exists');

  // Create Product for Auction
  const testProduct = await prisma.product.create({
    data: {
      sellerId: testSeller.id,
      categoryId: category.id,
      title: 'Bidding Engine Verification Lot',
      description: 'Used exclusively to verify high concurrency bidding, anti-sniping and auto-bidding.',
      condition: 'NEW',
      status: 'IN_AUCTION',
    },
  });

  // Create Live Auction
  const initialEndTime = new Date(Date.now() + 3600000); // 1 hour
  const testAuction = await prisma.auction.create({
    data: {
      productId: testProduct.id,
      sellerId: testSeller.id,
      startingPrice: 100000,
      reservePrice: 120000,
      minIncrement: 5000,
      currentHighestBid: 100000,
      bidCount: 0,
      startTime: new Date(Date.now() - 60000),
      endTime: initialEndTime,
      status: 'LIVE',
    },
  });

  const sellerToken = generateToken(testSeller);
  const tokenA = generateToken(buyerA);
  const tokenB = generateToken(buyerB);
  const tokenC = generateToken(buyerC);

  // 2. Health Check
  console.log('\n[1] Health Check');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  assert(healthRes.status === 200, `Health check HTTP 200 (Got: ${healthRes.status})`);
  assert(healthData.dependencies.postgres === 'UP', 'Postgres UP');
  assert(healthData.dependencies.redis === 'UP', 'Redis UP');

  // 3. Validation Rules
  console.log('\n[2] Bidding Rules Validation');
  // Seller cannot bid on own lot
  const selfBidRes = await fetch(`${BASE_URL}/api/v1/bids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      auctionId: testAuction.id,
      amount: 100000,
    }),
  });
  const selfBidData = await selfBidRes.json();
  assert(selfBidRes.status === 403, `Seller bidding rejected HTTP 403 (Got: ${selfBidRes.status})`);
  assert(selfBidData.error?.code === 'SELF_BID_FORBIDDEN', 'Code is SELF_BID_FORBIDDEN');

  // Bid below starting price
  const lowBidRes = await fetch(`${BASE_URL}/api/v1/bids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      auctionId: testAuction.id,
      amount: 50000,
    }),
  });
  assert(lowBidRes.status === 400, `Bid below start rejected HTTP 400 (Got: ${lowBidRes.status})`);

  // 4. First Valid Manual Bid (Buyer A)
  console.log('\n[3] First Valid Manual Bid');
  const firstBidRes = await fetch(`${BASE_URL}/api/v1/bids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      auctionId: testAuction.id,
      amount: 100000,
    }),
  });
  const firstBidData = await firstBidRes.json();
  assert(firstBidRes.status === 201, `First bid accepted HTTP 201 (Got: ${firstBidRes.status})`);
  assert(Number(firstBidData.data?.bid?.amount) === 100000, 'Bid amount is 100000');
  assert(firstBidData.data?.bid?.bidder?.id === buyerA.id, 'Bidder matches Buyer A');

  // Cannot bid if already highest bidder
  const repeatSelfRes = await fetch(`${BASE_URL}/api/v1/bids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      auctionId: testAuction.id,
      amount: 110000,
    }),
  });
  assert(repeatSelfRes.status === 400, `Repeat highest bidder rejected HTTP 400 (Got: ${repeatSelfRes.status})`);

  // 5. Idempotency Check (Buyer B)
  console.log('\n[4] Idempotency Handling');
  const idempotencyKey = `idemp-test-${Date.now()}`;
  const bidB1Res = await fetch(`${BASE_URL}/api/v1/bids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      auctionId: testAuction.id,
      amount: 105000,
    }),
  });
  const bidB1Data = await bidB1Res.json();
  assert(bidB1Res.status === 201, `Initial bid with idempotency key accepted HTTP 201 (Got: ${bidB1Res.status})`);

  // Replay request
  const bidB2Res = await fetch(`${BASE_URL}/api/v1/bids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      auctionId: testAuction.id,
      amount: 105000,
    }),
  });
  const bidB2Data = await bidB2Res.json();
  assert(bidB2Res.status === 201, `Idempotent duplicate returns HTTP 201 (Got: ${bidB2Res.status})`);
  assert(bidB2Data.data?.isIdempotentReplay === true, 'Response flagged as isIdempotentReplay');

  // 6. Auto-Bidding Engine (Buyer C sets max budget 150000)
  console.log('\n[5] Auto-Bidding (Proxy Bidding Engine)');
  const setAutoRes = await fetch(`${BASE_URL}/api/v1/bids/auto`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenC}`,
    },
    body: JSON.stringify({
      auctionId: testAuction.id,
      maxBudget: 150000,
    }),
  });
  const setAutoData = await setAutoRes.json();
  assert(setAutoRes.status === 200, `Configure auto-bid HTTP 200 (Got: ${setAutoRes.status})`);
  assert(Number(setAutoData.data?.autoBid?.maxBudget) === 150000, 'Max budget stored correctly');

  // Verify that Buyer C automatically outbid Buyer B (who had 105000)
  const afterAutoAuction = await prisma.auction.findUnique({ where: { id: testAuction.id } });
  assert(afterAutoAuction.currentHighestBidderId === buyerC.id, 'Buyer C auto-bid triggered and became highest bidder');
  assert(Number(afterAutoAuction.currentHighestBid) === 110000, `Buyer C placed minimum needed increment (Got: ₹${afterAutoAuction.currentHighestBid})`);

  // Buyer A places manual bid of 115000 -> Auto engine should automatically counter for Buyer C at 120000
  console.log('\n[6] Auto-Bid Counter to Competing Manual Bid');
  const bidARes = await fetch(`${BASE_URL}/api/v1/bids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      auctionId: testAuction.id,
      amount: 115000,
    }),
  });
  assert(bidARes.status === 201, `Buyer A manual bid accepted (Got: ${bidARes.status})`);

  const counterAuction = await prisma.auction.findUnique({ where: { id: testAuction.id } });
  assert(counterAuction.currentHighestBidderId === buyerC.id, 'Buyer C auto-bid engine automatically countered Buyer A');
  assert(Number(counterAuction.currentHighestBid) === 120000, `Buyer C auto-countered at ₹120000 (Got: ₹${counterAuction.currentHighestBid})`);

  // 7. Anti-Sniping Protection
  console.log('\n[7] Anti-Sniping Protection');
  // Set auction end time to expire in 15 seconds
  const nearExpiryTime = new Date(Date.now() + 15000);
  await prisma.auction.update({
    where: { id: testAuction.id },
    data: { endTime: nearExpiryTime },
  });

  const snipeBidRes = await fetch(`${BASE_URL}/api/v1/bids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      auctionId: testAuction.id,
      amount: 125000,
    }),
  });
  assert(snipeBidRes.status === 201, `Bid during anti-sniping window accepted (Got: ${snipeBidRes.status})`);

  const snipedAuction = await prisma.auction.findUnique({ where: { id: testAuction.id } });
  assert(snipedAuction.antiSnipingTriggered === true, 'antiSnipingTriggered flag set to true');
  assert(snipedAuction.status === 'EXTENDED', 'Auction status changed to EXTENDED');
  assert(snipedAuction.endTime.getTime() > nearExpiryTime.getTime(), 'Auction endTime extended into future');

  // 8. Bid History & User Bids Discovery
  console.log('\n[8] Bid History Discovery');
  const historyRes = await fetch(`${BASE_URL}/api/v1/bids/auction/${testAuction.id}`);
  const historyData = await historyRes.json();
  assert(historyRes.status === 200, `Auction bid history HTTP 200 (Got: ${historyRes.status})`);
  assert(historyData.data?.length > 0, 'Bid history contains recorded bids');
  assert(historyData.data?.[0]?.bidder?.maskedUsername?.includes('****'), 'Bidder username is masked for public privacy');

  const myBidsRes = await fetch(`${BASE_URL}/api/v1/bids/my-bids`, {
    headers: {
      Authorization: `Bearer ${tokenA}`,
    },
  });
  const myBidsData = await myBidsRes.json();
  assert(myBidsRes.status === 200, `User my-bids HTTP 200 (Got: ${myBidsRes.status})`);
  assert(myBidsData.data?.length > 0, 'User bids list returned');

  // 9. Redis Cache State Verification
  console.log('\n[9] Redis Real-Time State Sync');
  const redisState = await getAuctionState(testAuction.id);
  assert(redisState !== null, 'Redis state found');
  assert(redisState.currentBid === Number(snipedAuction.currentHighestBid), `Redis cached bid matches DB (₹${redisState.currentBid})`);

  // Cleanup
  console.log('\n[Cleanup] Cleaning up test entities...');
  await prisma.bid.deleteMany({ where: { auctionId: testAuction.id } });
  await prisma.autoBid.deleteMany({ where: { auctionId: testAuction.id } });
  await prisma.auction.deleteMany({ where: { id: testAuction.id } });
  await prisma.product.deleteMany({ where: { id: testProduct.id } });

  console.log('\n====================================================');
  console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .then(() => {
    console.log('✓ All Bid Service integration tests passed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Bid test exception:', err);
    process.exit(1);
  });
