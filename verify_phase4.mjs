import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

neonConfig.webSocketConstructor = ws;
const connectionString = 'postgresql://neondb_owner:npg_FE6kSc0gNLqT@ep-dry-tree-azxde4bc-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
process.env.DATABASE_URL = connectionString;

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function resetAndSeedDB() {
  console.log("Cleaning database...");
  await prisma.inventoryLog.deleteMany({});
  await prisma.rawMaterial.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.dayEndRecord.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.refund.deleteMany({});
  await prisma.creditLedger.deleteMany({}); // Added this
  await prisma.invoice.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  
  console.log("Seeding Phase 4 data...");
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

  // Seed invoices to show up in Reports (Current Date)
  const order = await prisma.order.create({ data: { branch_id: branch.id, type: 'dine-in', status: 'completed' } });
  
  // Need explicit created_at to ensure it counts as "today"
  const now = new Date();
  await prisma.invoice.create({
    data: {
      order_id: order.id,
      invoice_number: 'INV-TEST-001',
      subtotal: 500,
      total: 500,
      payment_method: 'Cash',
      created_at: now
    }
  });

  await prisma.invoice.create({
    data: {
      order_id: order.id,
      invoice_number: 'INV-TEST-002',
      subtotal: 300,
      total: 300,
      payment_method: 'UPI',
      created_at: now
    }
  });

  // Seed Refund
  await prisma.refund.create({
    data: {
      invoice_id: (await prisma.invoice.findFirst()).id,
      amount: 100,
      reason: 'Refunded',
      created_at: now
    }
  });

  // Seed Inventory Item
  await prisma.rawMaterial.create({
    data: {
      name: 'Rice',
      unit: 'kg',
      current_stock: 20,
      low_stock_threshold: 5
    }
  });
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
    const artifactsDir = path.join(process.cwd(), 'test-artifacts-phase4');
    if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir);

    // Login
    await page.goto('http://localhost:3000/admin/login');
    await page.fill('input[name="mobile"]', '9999999999');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/dashboard/);

    // 1. Inventory & Low Stock Alert
    console.log("Testing Inventory Low Stock...");
    await page.goto('http://localhost:3000/admin/inventory');
    await sleep(1000);
    // Initial stock is 20. Threshold 5.
    // Click Reduce
    await page.locator('button:has-text("- Reduce")').first().click();
    await sleep(500);
    await page.fill('input[type="number"]', '17'); // Reduces to 3 (below threshold)
    await page.fill('input[placeholder="e.g. Kitchen consumption"]', 'Used for biryani');
    await page.click('button:has-text("Confirm")');
    await sleep(1500); // wait for revalidation
    await page.screenshot({ path: path.join(artifactsDir, '1_inventory_low_stock_alert.png') });

    // 2. Staff Management
    console.log("Testing Staff Management...");
    await page.goto('http://localhost:3000/admin/staff');
    await sleep(1000);
    await page.click('button:has-text("+ Add Staff")');
    await sleep(500);
    await page.fill('input[type="text"] >> nth=0', 'Rajesh Waiter');
    await page.fill('input[type="text"] >> nth=1', '8765432100');
    await page.selectOption('select', 'waiter');
    await page.fill('input[type="password"]', 'pass123');
    await sleep(500);
    await page.screenshot({ path: path.join(artifactsDir, '2_staff_add_modal.png') });
    await page.click('button:has-text("Save")');
    await sleep(1500);
    await page.screenshot({ path: path.join(artifactsDir, '3_staff_list_and_activity_log.png') }); // Will also show the inventory activity log!

    // 3. Reports & Day-End Close
    console.log("Testing Reports & Day End...");
    await page.goto('http://localhost:3000/admin/reports');
    await sleep(1500);
    await page.screenshot({ path: path.join(artifactsDir, '4_daily_sales_report.png') }); // Check the breakdown
    
    await page.click('button:has-text("Initiate Day-End Close")');
    await sleep(500);
    await page.screenshot({ path: path.join(artifactsDir, '5_day_end_modal.png') });
    await page.click('button:has-text("Confirm & Close Day")');
    await sleep(1500);
    await page.screenshot({ path: path.join(artifactsDir, '6_day_end_success.png') });

    await browser.close();
    console.log("Phase 4 functional tests passed successfully.");

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    if (nextProcess) nextProcess.kill();
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTests();
