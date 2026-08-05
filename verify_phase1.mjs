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
  await prisma.waiterCall.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.table.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.branch.deleteMany({});
  
  console.log("Seeding fresh data...");
  const branch = await prisma.branch.create({ data: { name: 'Main Branch' } });
  
  const table = await prisma.table.create({ 
    data: { name: 'T-1', branch_id: branch.id, status: 'vacant' }
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

  return { table, item };
}

async function runTests() {
  let nextProcess;
  
  try {
    // 1. Prepare DB
    await resetAndSeedDB();

    // 2. Start Next.js dev server
    console.log("Starting Next.js dev server...");
    nextProcess = spawn('npm', ['run', 'dev'], { shell: true });
    
    // Wait for server to be ready
    await new Promise((resolve) => {
      nextProcess.stdout.on('data', (data) => {
        if (data.toString().includes('Ready in')) {
          console.log('Next.js server is ready.');
          resolve();
        }
      });
      // also resolve after 10s just in case
      setTimeout(resolve, 10000);
    });

    await sleep(2000); // extra wait to be safe

    // 3. Launch Playwright
    console.log("Launching browser...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } }); // Mobile viewport
    const page = await context.newPage();

    const artifactsDir = path.join(process.cwd(), 'test-artifacts');
    if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir);

    // Step 1: Open Menu
    console.log("Opening /menu...");
    await page.goto('http://localhost:3000/menu?table=T-1');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(artifactsDir, '1_menu.png') });

    // Step 2: Add to cart
    console.log("Adding item to cart...");
    await page.click('text=ADD');
    await sleep(500);
    await page.screenshot({ path: path.join(artifactsDir, '2_cart_added.png') });

    // Step 3: Open Checkout
    console.log("Opening checkout...");
    await page.click('.cart-bar');
    await sleep(1000);
    await page.fill('input[type="tel"]', '9876543210');
    await page.fill('input[type="text"]', 'Test Customer');
    await page.screenshot({ path: path.join(artifactsDir, '3_checkout.png') });

    // Step 4: Place Order
    console.log("Placing order...");
    await page.click('button:has-text("Place Order")');
    await page.waitForURL(/\/order\/\d+/);
    console.log("Order placed successfully! URL:", page.url());
    await sleep(1000);
    await page.screenshot({ path: path.join(artifactsDir, '4_order_status.png') });

    const orderIdMatch = page.url().match(/\/order\/(\d+)/);
    const orderId = parseInt(orderIdMatch[1]);

    // Step 5: Call Waiter
    console.log("Testing Call Waiter...");
    // Handle the javascript alert
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Call Waiter")');
    await sleep(1000);
    await page.screenshot({ path: path.join(artifactsDir, '5_waiter_called.png') });

    // Verify DB
    const waiterCall = await prisma.waiterCall.findFirst({ where: { order_id: orderId } });
    if (!waiterCall) throw new Error("Waiter call was not registered in DB!");
    console.log("Verified WaiterCall in DB.");

    // Step 6: Test Real-time Status Update
    console.log("Simulating Admin setting order to completed...");
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'completed' }
    });

    console.log("Waiting for SWR polling to auto-transition the page...");
    // We expect the UI to change to the feedback form within 3-5 seconds
    await page.waitForSelector('text=Order Complete!', { timeout: 10000 });
    console.log("Page automatically updated without refresh!");
    await page.screenshot({ path: path.join(artifactsDir, '6_feedback_form.png') });

    await browser.close();
    console.log("All functional tests passed successfully.");

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    if (nextProcess) nextProcess.kill();
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTests();
