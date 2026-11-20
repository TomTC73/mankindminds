import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { test } from "node:test";
import { aboutDescription, aboutTitle, aboutUrl } from "../src/aboutMetadata.js";

test("built About page contains indexable content and page-specific metadata", async () => {
  const html = await readFile(new URL("../dist/about/index.html", import.meta.url), "utf8");
  const content = await readFile(new URL("../src/about-content.html", import.meta.url), "utf8");
  const sitemap = await readFile(new URL("../dist/sitemap.xml", import.meta.url), "utf8");
  assert.ok(html.includes(content));
  assert.ok(html.includes(`<title>${aboutTitle}</title>`));
  assert.ok(html.includes(`<meta name="description" content="${aboutDescription}" />`));
  assert.ok(html.includes(`<meta property="og:url" content="${aboutUrl}" />`));
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
  assert.ok(html.includes(`<link rel="canonical" href="${aboutUrl}" />`));
  assert.ok(sitemap.includes(`<loc>${aboutUrl}</loc>`));
  for (const [category, title] of [
    ["tattoos", "Burchett Verification"],
    ["art", "Cassatt Verification"],
    ["music", "Joplin Verification"],
    ["writing", "Ellison Verification"],
    ["videos", "Varda Verification"],
  ]) {
    assert.ok(html.includes(`name="review-category" value="${category}"`));
    assert.ok(html.includes(`data-category="${category}"`));
    assert.ok(html.includes(title));
  }
  assert.ok(html.includes('name="review-category" value="tattoos" checked'));
  assert.ok(html.includes("Dani"));
  assert.ok(html.includes("Thomas"));
});
