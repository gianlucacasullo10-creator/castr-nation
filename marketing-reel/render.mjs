import { chromium }                    from 'playwright';
import { execSync, spawnSync }          from 'child_process';
import path                            from 'path';
import fs                              from 'fs';
import { fileURLToPath }               from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Check ffmpeg ────────────────────────────────────────────────────────────
const ffCheck = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
if (ffCheck.error) {
  console.error('\nError: ffmpeg not found.\nInstall with: brew install ffmpeg\n');
  process.exit(1);
}

// ─── Config ──────────────────────────────────────────────────────────────────
const FPS          = 30;
const DURATION_S   = 17;            // matches S4_END clamp in scene.html
const TOTAL_FRAMES = DURATION_S * FPS;   // 510
const WIDTH        = 1080;
const HEIGHT       = 1920;
const FRAMES_DIR   = path.join(__dirname, 'frames');
const OUTPUT       = path.join(__dirname, 'castrs-reel.mp4');

// ─── Copy og-image ───────────────────────────────────────────────────────────
const ogSrc  = path.join(__dirname, '../public/og-image.png');
const ogDest = path.join(__dirname, 'og-image.png');
if (!fs.existsSync(ogDest)) {
  if (fs.existsSync(ogSrc)) {
    fs.copyFileSync(ogSrc, ogDest);
    console.log('✓ Copied og-image.png');
  } else {
    console.warn('⚠  og-image.png not found — logo will use fallback emoji.');
  }
}

// ─── Prepare frames dir ──────────────────────────────────────────────────────
if (fs.existsSync(FRAMES_DIR)) fs.rmSync(FRAMES_DIR, { recursive: true });
fs.mkdirSync(FRAMES_DIR);

// ─── Launch browser ──────────────────────────────────────────────────────────
console.log('\nLaunching browser…');
const browser = await chromium.launch();
const page    = await browser.newPage();
await page.setViewportSize({ width: WIDTH, height: HEIGHT });
await page.goto(`file://${path.join(__dirname, 'scene.html')}`);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);   // let Google Fonts finish rendering

// ─── Render frames ───────────────────────────────────────────────────────────
console.log(`\nRendering ${TOTAL_FRAMES} frames (${DURATION_S}s @ ${FPS}fps)…\n`);

const t0 = Date.now();
for (let i = 0; i < TOTAL_FRAMES; i++) {
  const tMs = (i / FPS) * 1000;
  await page.evaluate((t) => window.renderFrame(t), tMs);

  const framePath = path.join(FRAMES_DIR, `frame-${String(i).padStart(4, '0')}.png`);
  await page.screenshot({ path: framePath });

  if (i % 30 === 0 || i === TOTAL_FRAMES - 1) {
    const elapsed  = (Date.now() - t0) / 1000;
    const fps      = elapsed > 0 ? i / elapsed : 0;
    const etaSec   = fps > 0 ? ((TOTAL_FRAMES - i) / fps).toFixed(0) : '?';
    process.stdout.write(
      `\r  [${String(i).padStart(3)}/${TOTAL_FRAMES}]  ${String(Math.round(i / TOTAL_FRAMES * 100)).padStart(3)}%  ` +
      `${fps.toFixed(1)} fps  ~${etaSec}s left   `
    );
  }
}

await browser.close();
console.log('\n');

// ─── Stitch with FFmpeg ──────────────────────────────────────────────────────
console.log('Stitching with FFmpeg…\n');
execSync(
  `ffmpeg -y -framerate ${FPS} ` +
  `-i "${FRAMES_DIR}/frame-%04d.png" ` +
  `-c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p ` +
  `"${OUTPUT}"`,
  { stdio: 'inherit' }
);

// ─── Cleanup ────────────────────────────────────────────────────────────────
fs.rmSync(FRAMES_DIR, { recursive: true });

const sizeMb = (fs.statSync(OUTPUT).size / 1024 / 1024).toFixed(1);
console.log(`\n✓ Done!  →  ${OUTPUT}  (${sizeMb} MB)\n`);
