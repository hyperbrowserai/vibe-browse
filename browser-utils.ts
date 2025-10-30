import { existsSync, mkdirSync } from 'fs';

/**
 * Take a screenshot using Hyperbrowser's cloud browser
 * @param page - The Puppeteer page instance from Hyperbrowser
 * @returns Path to the saved screenshot
 */
export async function takeScreenshot(page: any) {
  const currentPath = process.cwd();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = `${currentPath}/agent/browser_screenshots/screenshot-${timestamp}.png`;

  // Ensure screenshots directory exists
  const screenshotsDir = `${currentPath}/agent/browser_screenshots`;
  if (!existsSync(screenshotsDir)) {
    mkdirSync(screenshotsDir, { recursive: true });
  }

  // Take screenshot using Playwright
  const screenshotBuffer = await page.screenshot({
    fullPage: true,
    type: 'png'
  });

  // Resize if needed using Sharp
  const sharp = (await import('sharp')).default;
  const image = sharp(screenshotBuffer);
  const metadata = await image.metadata();
  const { width, height } = metadata;

  let finalBuffer: Buffer = screenshotBuffer;

  // Only resize if image exceeds 2000x2000
  if (width && height && (width > 2000 || height > 2000)) {
    finalBuffer = await sharp(screenshotBuffer)
      .resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .png()
      .toBuffer();
  }

  // Save the screenshot
  const fs = await import('fs');
  fs.writeFileSync(screenshotPath, finalBuffer);
  
  return screenshotPath;
}

/**
 * Ensure required directories exist for Hyperbrowser operations
 */
export function ensureDirectories() {
  const baseDir = process.cwd();
  const dirs = [
    `${baseDir}/agent/browser_screenshots`,
    `${baseDir}/agent/custom_scripts`
  ];

  dirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });
}