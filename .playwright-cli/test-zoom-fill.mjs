import { chromium } from '/ms-playwright/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  // 1. Desktop Test: 1440x900
  console.log('Testing Desktop 1440x900...');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000');
  
  // Click first artwork
  await page.locator('button:has-text("Color Now")').first().click();
  await page.waitForSelector('canvas');
  console.log('In coloring studio on desktop');
  
  // Click Zoom In twice (100% -> 150% -> 200%)
  const zoomInBtn = page.getByRole('button', { name: 'Zoom In' });
  await zoomInBtn.click();
  await page.waitForTimeout(300);
  await zoomInBtn.click();
  await page.waitForTimeout(300);
  
  // Verify zoom text shows 200%
  const zoomText = await page.getByRole('button', { name: 'Reset Zoom' }).textContent();
  console.log('Current zoom level:', zoomText);

  // Select Sky Blue color (#0EA5E9)
  await page.locator('button[title*="Sky Blue"]').click();
  console.log('Selected Sky Blue');

  // Find canvas and click on elephant's face / head region
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  console.log('Canvas bounding box at 200%:', box);

  // Click on the elephant's head at 200% zoom
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.42);
  await page.waitForTimeout(600);

  // Select Sunset Orange (#F97316) and fill the left ear
  await page.locator('button[title*="Sunset Orange"]').click();
  await page.mouse.click(box.x + box.width * 0.38, box.y + box.height * 0.45);
  await page.waitForTimeout(600);

  // Switch to Brush Tool
  await page.getByRole('button', { name: 'Brush' }).click();
  // Select Fresh Green (#22C55E)
  await page.locator('button[title*="Fresh Green"]').click();
  // Draw strokes across elephant body while at 200% zoom
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.65);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.68, { steps: 5 });
  await page.mouse.move(box.x + box.width * 0.48, box.y + box.height * 0.72, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  // Take screenshot of desktop zoomed & colored
  await page.screenshot({ path: '.playwright-cli/desktop-zoomed-colored.png' });
  console.log('Captured .playwright-cli/desktop-zoomed-colored.png');
  await page.close();

  // 2. Mobile Phone Test: 390x844 (iPhone 14)
  console.log('Testing Mobile 390x844...');
  const mobilePage = await browser.newPage({ 
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true
  });
  await mobilePage.goto('http://localhost:3000');
  await mobilePage.locator('button:has-text("Color Now")').first().click();
  await mobilePage.waitForSelector('canvas');

  // Verify mobile palette is docked at bottom
  await mobilePage.screenshot({ path: '.playwright-cli/mobile-initial.png' });
  console.log('Captured .playwright-cli/mobile-initial.png');

  // Test Zoom In on Mobile
  const mobileZoomIn = mobilePage.getByRole('button', { name: 'Zoom In' });
  await mobileZoomIn.click();
  await mobilePage.waitForTimeout(300);
  await mobileZoomIn.click();
  await mobilePage.waitForTimeout(300);

  const mobileZoomText = await mobilePage.getByRole('button', { name: 'Reset Zoom' }).textContent();
  console.log('Mobile zoom level:', mobileZoomText);

  // Pick Magic Purple (#8B5CF6) from the docked bottom mobile palette
  await mobilePage.locator('button[title*="Magic Purple"]').click();
  
  // Fill while zoomed on mobile
  const mCanvas = mobilePage.locator('canvas').first();
  const mBox = await mCanvas.boundingBox();
  console.log('Mobile canvas box:', mBox);
  await mobilePage.mouse.click(mBox.x + mBox.width * 0.5, mBox.y + mBox.height * 0.42);
  await mobilePage.waitForTimeout(600);

  await mobilePage.screenshot({ path: '.playwright-cli/mobile-zoomed-colored.png' });
  console.log('Captured .playwright-cli/mobile-zoomed-colored.png');

  await mobilePage.close();
  await browser.close();
  console.log('All tests completed successfully!');
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
