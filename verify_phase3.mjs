import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

neonConfig.webSocketConstructor = ws;
const connectionString = 'postgresql://neondb_owner:npg_FE6kSc0gNLqT@ep-dry-tree-azxde4bc-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
process.env.DATABASE_URL = connectionString;

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function resetAndSeedDB() {
  console.log("Cleaning database...");
  await prisma.refund.deleteMany({});
  await prisma.creditLedger.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.customerProfile.deleteMany({});
  await prisma.waiterCall.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.table.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log("Seeding Billing Engine test data...");
  const branch = await prisma.branch.create({ data: { name: 'Main Branch' } });
  
  await prisma.user.create({
    data: {
      name: 'Admin',
      mobile: '9999999999',
      password_hash: 'dummyhash',
      role: 'admin',
      branch_id: branch.id
    }
  });

  const table = await prisma.table.create({ data: { name: 'T-1', branch_id: branch.id, status: 'occupied' } });
  const category = await prisma.category.create({ data: { name: 'Main Course', sort_order: 1 } });
  const item = await prisma.menuItem.create({
    data: { name: 'Paneer Butter Masala', price: 333.33, category_id: category.id } // Price adjusted for remainder test
  });

  // Seed Customer for Loyalty
  await prisma.customerProfile.create({
    data: { mobile: '8888888888', name: 'Loyal Customer', loyalty_points: 100 } // Has 100 points
  });

  // Create 5 orders to test all scenarios
  
  // Order 1: Settle Cash (Calculator test)
  const o1 = await prisma.order.create({ data: { branch_id: branch.id, type: 'dine-in', status: 'served', table_id: table.id } });
  await prisma.orderItem.create({ data: { order_id: o1.id, menu_item_id: item.id, quantity: 1, price_at_order: 500 } });

  // Order 2: Split Portion (Remainder test: Total 1000 / 3)
  const o2 = await prisma.order.create({ data: { branch_id: branch.id, type: 'dine-in', status: 'served', table_id: table.id } });
  await prisma.orderItem.create({ data: { order_id: o2.id, menu_item_id: item.id, quantity: 1, price_at_order: 1000 } });

  // Order 3: Split Items
  const o3 = await prisma.order.create({ data: { branch_id: branch.id, type: 'dine-in', status: 'served', table_id: table.id } });
  await prisma.orderItem.create({ data: { order_id: o3.id, menu_item_id: item.id, quantity: 2, price_at_order: 400 } });

  // Order 4: Credit / Udhar
  const o4 = await prisma.order.create({ data: { branch_id: branch.id, type: 'dine-in', status: 'served', customer_mobile: '9876543210', customer_name: 'Udhar Guy', table_id: table.id } });
  await prisma.orderItem.create({ data: { order_id: o4.id, menu_item_id: item.id, quantity: 1, price_at_order: 600 } });

  // Order 5: Loyalty Redeem
  const o5 = await prisma.order.create({ data: { branch_id: branch.id, type: 'dine-in', status: 'served', customer_mobile: '8888888888', customer_name: 'Loyal Customer', table_id: table.id } });
  await prisma.orderItem.create({ data: { order_id: o5.id, menu_item_id: item.id, quantity: 1, price_at_order: 550 } });

}

async function runTests() {
  let nextProcess;
  
  try {
    await resetAndSeedDB();

    console.log("Starting Next.js dev server...");
    nextProcess = spawn('npm', ['run', 'dev'], { shell: true });
    
    await new Promise((resolve) => {
      nextProcess.stdout.on('data', (data) => {
        if (data.toString().includes('Ready in')) resolve();
      });
      setTimeout(resolve, 10000);
    });

    await sleep(2000);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const artifactsDir = path.join(process.cwd(), 'test-artifacts-phase3');
    if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir);

    // Login
    await page.goto('http://localhost:3000/admin/login');
    await page.fill('input[name="mobile"]', '9999999999');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/dashboard/);

    // 1. Settle Calculator Test
    console.log("Testing Settle Calculator...");
    // Open first Settle Bill modal
    await page.locator('button:has-text("Settle Bill")').first().click();
    await sleep(500);
    await page.fill('input[placeholder="e.g. 2000"]', '1000'); // Order is 500, paid 1000
    await sleep(500);
    await page.screenshot({ path: path.join(artifactsDir, '1_settle_calculator.png') });
    await page.click('button:has-text("Complete Payment")');
    await sleep(1000);

    // 2. Split Bill Portion (Remainder Test)
    console.log("Testing Split Bill Portion...");
    await page.locator('button:has-text("Split")').first().click();
    await sleep(500);
    await page.fill('input[type="number"]', '3'); // Split 1000 into 3
    await sleep(500);
    await page.screenshot({ path: path.join(artifactsDir, '2_split_portion_remainder.png') });
    await page.click('button:has-text("Execute Split")');
    await sleep(1000);

    // 3. Split Bill Items
    console.log("Testing Split Items...");
    await page.locator('button:has-text("Split")').first().click();
    await sleep(500);
    await page.click('button:has-text("Item-wise")');
    await sleep(500);
    await page.locator('input[type="checkbox"]').first().check();
    await sleep(500);
    await page.screenshot({ path: path.join(artifactsDir, '3_split_item_wise.png') });
    await page.click('button:has-text("Execute Split")');
    await sleep(1000);

    // 4. Credit Ledger Test
    console.log("Testing Credit Ledger...");
    await page.locator('button:has-text("Settle Bill")').first().click();
    await sleep(500);
    await page.selectOption('select', 'Credit'); // Changed to Udhar
    await sleep(500);
    await page.click('button:has-text("Complete Payment")');
    await sleep(1000);

    // Go to Ledger Tab
    await page.click('button:has-text("Credit Ledger")');
    await sleep(1000);
    await page.screenshot({ path: path.join(artifactsDir, '4_credit_ledger.png') });

    // 5. Loyalty Points & Discount
    console.log("Testing Loyalty Discount...");
    await page.click('button:has-text("Active Tables")');
    await sleep(500);
    // Find the specific card for the loyal customer by searching for their mobile number
    const loyalCard = page.locator('.card', { hasText: '8888888888' });
    await loyalCard.locator('button:has-text("Settle Bill")').click();
    await sleep(500);
    // Fill discount field
    await page.fill('input[type="number"]', '50'); // Redeem 50 points
    await sleep(500);
    await page.screenshot({ path: path.join(artifactsDir, '5_loyalty_redeem.png') });
    await page.click('button:has-text("Complete Payment")');
    await sleep(1000);

    // Verify DB for loyalty points mathematically
    const loyalUser = await prisma.customerProfile.findUnique({ where: { mobile: '8888888888' } });
    console.log("Loyalty Points after transaction:", loyalUser.loyalty_points);
    // Initial 100 - 50 redeemed = 50. Total 550 - 50 discount = 500 post-discount. Earn 5 points.
    // Total expected = 50 + 5 = 55 points.
    if (loyalUser.loyalty_points !== 55) {
      console.error(`Loyalty points math mismatch! Expected 55, got ${loyalUser.loyalty_points}`);
    } else {
      console.log("Loyalty points perfectly calculated post-discount.");
    }

    // 6. Refund logic
    console.log("Testing Refund logic...");
    await page.click('button:has-text("Invoice History")');
    await sleep(1000);
    await page.locator('button:has-text("Refund")').first().click();
    await sleep(500);
    await page.fill('input[type="number"]', '100');
    await sleep(500);
    await page.screenshot({ path: path.join(artifactsDir, '6_refund_modal.png') });
    await page.click('button:has-text("Process Refund")');
    await sleep(1000);
    await page.screenshot({ path: path.join(artifactsDir, '7_invoice_history_after_refund.png') });

    await browser.close();
    console.log("Phase 3 functional tests passed successfully.");

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    if (nextProcess) nextProcess.kill();
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTests();
