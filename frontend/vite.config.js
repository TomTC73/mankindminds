import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { aboutDescription, aboutTitle, aboutUrl } from "./src/aboutMetadata.js";

function staticAboutPage() {
  let output;
  let root;
  return {
    name: "static-about-page",
    apply: "build",
    configResolved(config) {
      root = config.root;
      output = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      let html = await readFile(resolve(output, "index.html"), "utf8");
      const content = await readFile(resolve(root, "src/about-content.html"), "utf8");
      const replace = (pattern, value) => {
        const found = typeof pattern === "string" ? html.includes(pattern) : pattern.test(html);
        if (!found) throw new Error(`Could not generate About page: missing ${pattern}`);
        html = html.replace(pattern, value);
      };
      replace(/<title>[^<]*<\/title>/, `<title>${aboutTitle}</title>`);
      for (const [attribute, name, value] of [
        ["name", "description", aboutDescription],
        ["property", "og:title", aboutTitle],
        ["property", "og:description", aboutDescription],
        ["property", "og:url", aboutUrl],
        ["name", "twitter:title", aboutTitle],
        ["name", "twitter:description", aboutDescription],
      ]) {
        replace(new RegExp(`<meta\\s+${attribute}="${name}"\\s+content="[^"]*"\\s*/>`),
          `<meta ${attribute}="${name}" content="${value}" />`);
      }
      replace("</head>", `<link rel="canonical" href="${aboutUrl}" />\n  </head>`);
      replace('<div id="root"></div>', `<div id="root"><div class="about-page">${content}</div></div>`);
      await mkdir(resolve(output, "about"), { recursive: true });
      await writeFile(resolve(output, "about/index.html"), html);
    },
  };
}

export default defineConfig({
  plugins: [react(), staticAboutPage()],
  server: {
    port: 5173,
  },
});
