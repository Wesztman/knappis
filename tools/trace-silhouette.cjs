// Trace a gamepad silhouette and the coloured face-button centroids from a
// straight-on photo (dark pad on a white background). Prints JSON.
// Usage: cd game && NODE_PATH=node_modules node ../tools/trace-silhouette.cjs photo.png
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const file = process.argv[2];
  const b64 = fs.readFileSync(file).toString("base64");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(`<img id="i" src="data:image/png;base64,${b64}">`);
  await page.waitForFunction(() => document.getElementById("i").complete);
  const result = await page.evaluate(() => {
    const img = document.getElementById("i");
    const w = img.naturalWidth,
      h = img.naturalHeight;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, w, h).data;
    const dark = new Uint8Array(w * h);
    const sums = { Y: [0, 0, 0], A: [0, 0, 0], X: [0, 0, 0], B: [0, 0, 0] };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = d[i],
          g = d[i + 1],
          b = d[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum < 120) dark[y * w + x] = 1;
        // Saturated letter colours.
        const max = Math.max(r, g, b),
          min = Math.min(r, g, b);
        if (max - min > 90) {
          let k = null;
          if (r > 180 && g > 160 && b < 100) k = "Y";
          else if (g > 150 && r < 140 && b < 120) k = "A";
          else if (b > 170 && r < 120) k = "X";
          else if (r > 180 && g < 110 && b < 110) k = "B";
          if (k) {
            sums[k][0] += x;
            sums[k][1] += y;
            sums[k][2]++;
          }
        }
      }
    }
    // Per-column top and bottom of the dark region.
    const top = [],
      bottom = [];
    for (let x = 0; x < w; x++) {
      let t = -1,
        b = -1;
      for (let y = 0; y < h; y++)
        if (dark[y * w + x]) {
          t = y;
          break;
        }
      for (let y = h - 1; y >= 0; y--)
        if (dark[y * w + x]) {
          b = y;
          break;
        }
      top.push(t);
      bottom.push(b);
    }
    const letters = {};
    for (const k of Object.keys(sums)) {
      const [sx, sy, n] = sums[k];
      letters[k] = n ? { x: sx / n, y: sy / n, n } : null;
    }
    return { w, h, top, bottom, letters };
  });
  await browser.close();

  const { w, h, top, bottom, letters } = result;
  const cols = [];
  for (let x = 0; x < w; x++) if (top[x] >= 0) cols.push(x);
  const x0 = cols[0],
    x1 = cols[cols.length - 1];
  let yMin = Infinity,
    yMax = -Infinity;
  for (const x of cols) {
    yMin = Math.min(yMin, top[x]);
    yMax = Math.max(yMax, bottom[x]);
  }
  const cx = (x0 + x1) / 2,
    cy = (yMin + yMax) / 2;
  const scale = 256 / (x1 - x0);
  const norm = (x, y) => [
    Math.round((x - cx) * scale * 10) / 10,
    Math.round((y - cy) * scale * 10) / 10,
  ];

  const step = Math.max(1, Math.round((x1 - x0) / 60));
  const outline = [];
  for (let x = x0; x <= x1; x += step) outline.push(norm(x, top[x]));
  outline.push(norm(x1, top[x1]));
  for (let x = x1; x >= x0; x -= step) outline.push(norm(x, bottom[x]));
  outline.push(norm(x0, bottom[x0]));

  const feats = {};
  for (const k of Object.keys(letters))
    feats[k] = letters[k] ? norm(letters[k].x, letters[k].y) : null;

  console.log(
    JSON.stringify({
      size: [w, h],
      bbox: [x0, yMin, x1, yMax],
      height: Math.round((yMax - yMin) * scale),
      outline,
      letters: feats,
    }),
  );
})();
