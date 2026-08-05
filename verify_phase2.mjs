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

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

async function resetAndSeedDB() {
  console.log("Cleaning database...");
  await prisma.waiterCall.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.table.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log("Seeding KDS test data...");
  const branch = await prisma.branch.create({ data: { name: 'Main Branch' } });
  
  // Seed admin user
  await prisma.user.create({
    data: {
      name: 'Admin',
      mobile: '9999999999',
      password_hash: 'dummyhash',
      role: 'admin',
      branch_id: branch.id
    }
  });

  const table = await prisma.table.create({ 
    data: { name: 'T-1', branch_id: branch.id, status: 'occupied' }
  });
  
  const category = await prisma.category.create({
    data: { name: 'Main Course', sort_order: 1 }
  });

  const item = await prisma.menuItem.create({
    data: {
      name: 'Paneer Butter Masala',
      price: 250.00,
      category_id: category.id,
      is_veg: true,
      food_type: 'veg',
      is_available: true
    }
  });

  // Seed a new order
  const order = await prisma.order.create({
    data: {
      branch_id: branch.id,
      table_id: table.id,
      type: 'dine-in',
      status: 'new',
      has_new_items: true, // Will highlight the KOT
      customer_name: 'Test Customer'
    }
  });

  await prisma.orderItem.create({
    data: {
      order_id: order.id,
      menu_item_id: item.id,
      quantity: 2,
      price_at_order: 250.00,
      kot_number: 1
    }
  });

  // Seed a waiter call
  await prisma.waiterCall.create({
    data: {
      order_id: order.id,
      table_name: 'T-1',
      status: 'pending'
    }
  });

  return { branch, order };
}

async function runTests() {
  let nextProcess;
  
  try {
    await resetAndSeedDB();

    console.log("Starting Next.js dev server...");
    nextProcess = spawn('npm', ['run', 'dev'], { shell: true });
    
    await new Promise((resolve) => {
      nextProcess.stdout.on('data', (data) => {
        if (data.toString().includes('Ready in')) {
          console.log('Next.js server is ready.');
          resolve();
        }
      });
      setTimeout(resolve, 10000);
    });

    await sleep(2000);

    console.log("Launching browser...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    const artifactsDir = path.join(process.cwd(), 'test-artifacts-phase2');
    if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir);

    // Step 1: Login
    console.log("Logging into Admin Panel...");
    await page.goto('http://localhost:3000/admin/login');
    await page.fill('input[name="mobile"]', '9999999999');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/dashboard/);

    // Step 2: Navigate to Live Orders (KDS)
    console.log("Navigating to Live Orders...");
    await page.click('text=Live Orders');
    await page.waitForURL(/\/admin\/live_orders/);
    await sleep(1500); // Wait for SWR fetch
    await page.screenshot({ path: path.join(artifactsDir, '1_kds_initial.png') });

    // Step 3: Acknowledge Waiter Call
    console.log("Acknowledging waiter call...");
    await page.click('text=Acknowledge');
    await sleep(1000); // Wait for SWR to remove it
    await page.screenshot({ path: path.join(artifactsDir, '2_kds_ack_call.png') });

    // Step 4: Accept Order
    console.log("Accepting order (New -> Preparing)...");
    await page.click('text=Accept');
    await sleep(1000);
    await page.screenshot({ path: path.join(artifactsDir, '3_kds_preparing.png') });

    // Step 5: Serve Order
    console.log("Serving order (Preparing -> Served)...");
    await page.click('text=Serve');
    await sleep(1000);
    await page.screenshot({ path: path.join(artifactsDir, '4_kds_served.png') });

    await browser.close();
    console.log("Phase 2 functional tests passed successfully.");

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    if (nextProcess) nextProcess.kill();
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTests();
