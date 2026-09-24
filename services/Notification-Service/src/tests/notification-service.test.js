import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import prisma from '../prisma/client.js';
import redis from '../redis/client.js';
import app from '../app.js';
import { pushToDLQ } from '../services/dlq.service.js';

const PORT = 3099; // Isolated test port
const BASE_URL = `http://localhost:${PORT}`;

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
  console.log('\n=============================================================');
  console.log('    Auctra Notification Service — Integration Test Suite     ');
  console.log('=============================================================\n');

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

  // 1. Connect Prisma and Redis
  await prisma.$connect();
  try {
    await redis.connect();
  } catch {}

  // 2. Start Test Server
  const server = app.listen(PORT);
  console.log(`[Test Server] Running on ${BASE_URL}\n`);

  try {
    // 3. Test Probes & Metadata
    console.log('--- Suite 1: Health, Readiness & Metadata ---');
    const rootRes = await fetch(`${BASE_URL}/`);
    const rootData = await rootRes.json();
    assert(rootRes.status === 200 && rootData.status === 'ONLINE', 'Root endpoint reports service ONLINE');

    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'HEALTHY', 'Health check is HEALTHY (Postgres & Redis UP)');

    const readyRes = await fetch(`${BASE_URL}/readiness`);
    assert(readyRes.status === 200, 'Readiness probe returns 200 OK');

    const liveRes = await fetch(`${BASE_URL}/liveness`);
    assert(liveRes.status === 200, 'Liveness probe returns 200 OK');

    // 4. Setup Test Users (Buyer & Admin)
    console.log('\n--- Suite 2: Setup Test Users & Authentication ---');
    const testBuyer = await prisma.user.upsert({
      where: { email: 'notif_test_buyer@auctra.internal' },
      update: { role: 'BUYER', status: 'ACTIVE' },
      create: {
        email: 'notif_test_buyer@auctra.internal',
        username: 'notif_test_buyer',
        passwordHash: 'mock-hash',
        firstName: 'Test',
        lastName: 'Buyer',
        role: 'BUYER',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    const testAdmin = await prisma.user.upsert({
      where: { email: 'notif_test_admin@auctra.internal' },
      update: { role: 'ADMIN', status: 'ACTIVE' },
      create: {
        email: 'notif_test_admin@auctra.internal',
        username: 'notif_test_admin',
        passwordHash: 'mock-hash',
        firstName: 'System',
        lastName: 'Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    const buyerToken = generateToken(testBuyer);
    const adminToken = generateToken(testAdmin);
    assert(buyerToken && adminToken, 'Generated JWT tokens for Buyer and Admin');

    // 5. Test Direct Notification Dispatch (POST /api/v1/notifications/send)
    console.log('\n--- Suite 3: Direct Notification Dispatch ---');
    const sendRes = await fetch(`${BASE_URL}/api/v1/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testBuyer.id,
        type: 'AUCTION_OUTBID',
        title: 'You have been outbid on Rolex Submariner',
        message: 'A higher bid of ₹12,50,000 has been placed.',
        data: {
          auctionId: '00000000-0000-0000-0000-000000000001',
          auctionTitle: 'Rolex Submariner Date 2024',
          amount: 1250000,
        },
        channels: ['IN_APP'], // In-app for test verification
      }),
    });

    const sendData = await sendRes.json();
    assert(sendRes.status === 201 && sendData.success === true, 'Successfully dispatched direct notification');
    const createdNotifId = sendData.data.notification?.id;
    assert(Boolean(createdNotifId), `Notification persisted with UUID ${createdNotifId}`);

    // 6. Test User Notification Fetch & Unread Count
    console.log('\n--- Suite 4: Fetch Notifications & Unread Count ---');
    const listRes = await fetch(`${BASE_URL}/api/v1/notifications`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200 && Array.isArray(listData.data), 'User can retrieve paginated notification list');
    assert(listData.meta.total >= 1, `Total notifications count is >= 1 (found ${listData.meta.total})`);

    const countRes = await fetch(`${BASE_URL}/api/v1/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const countData = await countRes.json();
    assert(countRes.status === 200 && countData.data.unreadCount >= 1, `Unread count retrieved (${countData.data.unreadCount})`);

    // 7. Test Mark as Read & Mark All as Read
    console.log('\n--- Suite 5: Mark Notifications as Read ---');
    if (createdNotifId) {
      const readRes = await fetch(`${BASE_URL}/api/v1/notifications/${createdNotifId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${buyerToken}` },
      });
      const readData = await readRes.json();
      assert(readRes.status === 200 && readData.data.isRead === true, 'Successfully marked single notification as read');
    }

    const readAllRes = await fetch(`${BASE_URL}/api/v1/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const readAllData = await readAllRes.json();
    assert(readAllRes.status === 200 && readAllData.success === true, 'Successfully executed mark-all-as-read');

    // 8. Test Notification Preferences
    console.log('\n--- Suite 6: User Notification Preferences ---');
    const prefGetRes = await fetch(`${BASE_URL}/api/v1/notifications/preferences`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const prefGetData = await prefGetRes.json();
    assert(prefGetRes.status === 200 && prefGetData.data.email !== undefined, 'Retrieved default user preferences');

    const prefPutRes = await fetch(`${BASE_URL}/api/v1/notifications/preferences`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${buyerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: { outbid: false, auctionWon: true },
        inApp: { outbid: true },
      }),
    });
    const prefPutData = await prefPutRes.json();
    assert(prefPutRes.status === 200 && prefPutData.data.email.outbid === false, 'Successfully updated user notification preferences');

    // 9. Test Admin Operations (Broadcast & Metrics)
    console.log('\n--- Suite 7: Admin Broadcast & Metrics ---');
    // Non-admin attempt should be forbidden
    const forbiddenRes = await fetch(`${BASE_URL}/api/v1/notifications/admin/broadcast`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${buyerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Unauthorized Test',
        message: 'Should be rejected',
      }),
    });
    assert(forbiddenRes.status === 403, 'Non-admin user forbidden from admin broadcast (403)');

    // Admin broadcast
    const broadcastRes = await fetch(`${BASE_URL}/api/v1/notifications/admin/broadcast`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Scheduled Maintenance Notice',
        message: 'Auctra platform will undergo scheduled upgrades at midnight UTC.',
        type: 'SYSTEM',
        data: { maintenanceStart: new Date().toISOString() },
      }),
    });
    const broadcastData = await broadcastRes.json();
    assert(broadcastRes.status === 200 && broadcastData.data.dispatchedCount >= 1, `Admin broadcast dispatched to active users (${broadcastData.data.dispatchedCount})`);

    // Admin metrics
    const statsRes = await fetch(`${BASE_URL}/api/v1/notifications/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsData = await statsRes.json();
    assert(statsRes.status === 200 && statsData.data.notifications.totalNotifications >= 1, 'Admin metrics retrieved notification stats');

    // 10. Test Dead-Letter Queue (DLQ) Lifecycle
    console.log('\n--- Suite 8: Dead-Letter Queue (DLQ) Architecture ---');
    const dlqItem = await pushToDLQ({
      eventName: 'auction:events:SIMULATED_FAIL',
      payload: { auctionId: 'fake-auction-id', amount: 5000 },
      error: new Error('Simulated external service timeout'),
      retryCount: 3,
    });
    assert(Boolean(dlqItem?.id), `Mock failed event successfully placed into DLQ (ID: ${dlqItem?.id})`);

    // List DLQ
    const dlqListRes = await fetch(`${BASE_URL}/api/v1/notifications/admin/dlq`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dlqListData = await dlqListRes.json();
    assert(dlqListRes.status === 200 && dlqListData.data.length >= 1, `Admin can list DLQ failed events (found ${dlqListData.data.length})`);

    // Get DLQ single record
    if (dlqItem?.id) {
      const dlqGetRes = await fetch(`${BASE_URL}/api/v1/notifications/admin/dlq/${dlqItem.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const dlqGetData = await dlqGetRes.json();
      assert(dlqGetRes.status === 200 && dlqGetData.data.id === dlqItem.id, 'Admin can inspect specific DLQ failed event');
    }

    // Purge DLQ
    const dlqPurgeRes = await fetch(`${BASE_URL}/api/v1/notifications/admin/dlq`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dlqPurgeData = await dlqPurgeRes.json();
    assert(dlqPurgeRes.status === 200 && dlqPurgeData.success === true, 'Admin can purge DLQ cleanly');

    // 11. Test Delete & Clear Read Notifications
    console.log('\n--- Suite 9: Cleanup & Notification Deletion ---');
    if (createdNotifId) {
      const delRes = await fetch(`${BASE_URL}/api/v1/notifications/${createdNotifId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${buyerToken}` },
      });
      const delData = await delRes.json();
      assert(delRes.status === 200 && delData.data.deletedId === createdNotifId, 'User can delete single notification');
    }

    const clearReadRes = await fetch(`${BASE_URL}/api/v1/notifications/clear-read`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const clearReadData = await clearReadRes.json();
    assert(clearReadRes.status === 200 && clearReadData.success === true, 'User can clear all read notifications');
  } catch (err) {
    console.error('\n✗ Test Suite Runtime Exception:', err);
    failed++;
  } finally {
    // Teardown
    server.close();
    await prisma.$disconnect();
    await redis.quit();

    console.log('\n=============================================================');
    console.log(`   Tests Completed: ${passed} Passed | ${failed} Failed      `);
    console.log('=============================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
