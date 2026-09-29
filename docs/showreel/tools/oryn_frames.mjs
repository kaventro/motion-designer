import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { openPage } from "../../../skills/motion-designer/scripts/cdp.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const film = resolve(here, "../../../examples/oryn/film/index.html");
const out = resolve(here, "../assets/img");
const [from = 3.28125, count = 226, size = 960, quality = 82] = process.argv.slice(2).map(Number);
mkdirSync(out, { recursive: true });

const page = await openPage(pathToFileURL(film).href, { width: 1440, height: 1440, scale: 1 });
try {
  await page.evaluate("window.film.ready");
  const started = Date.now();
  for (let j = 0; j < count; j++) {
    const t = from + j / 60;
    await page.evaluate(`window.film.remount(${t})`);
    await page.evaluate("window.film.settled()");
    const shot = await page.send("Page.captureScreenshot", { format: "jpeg", quality, clip: { x: 0, y: 0, width: 1440, height: 1440, scale: size / 1440 } });
    writeFileSync(join(out, `oryn_${String(j).padStart(3, "0")}.jpg`), Buffer.from(shot.data, "base64"));
    if (j % 25 === 0) console.log(`frame ${j}/${count} at ${t.toFixed(3)}s, ${((Date.now() - started) / 1000).toFixed(0)}s`);
  }
  if (page.errors.length) console.error("page errors:", page.errors.slice(0, 3));
} finally {
  await page.close();
}
