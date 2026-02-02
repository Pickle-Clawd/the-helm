#!/usr/bin/env node

// Build theme index — reads all public/themes/<name>/theme.json files
// and generates public/themes/index.json
// Run before `next build` to ensure theme registry is up to date.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const themesDir = join(__dirname, "..", "public", "themes");

async function buildThemeIndex() {
  const entries = await readdir(themesDir, { withFileTypes: true });
  const themes = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const themeJsonPath = join(themesDir, entry.name, "theme.json");
    try {
      const raw = await readFile(themeJsonPath, "utf-8");
      const theme = JSON.parse(raw);
      themes.push(theme);
    } catch {
      console.warn(`⚠ Skipping ${entry.name}/ — no valid theme.json`);
    }
  }

  // Sort: midnight first (default), then alphabetical
  themes.sort((a, b) => {
    if (a.id === "midnight") return -1;
    if (b.id === "midnight") return 1;
    return a.name.localeCompare(b.name);
  });

  const indexPath = join(themesDir, "index.json");
  await writeFile(indexPath, JSON.stringify(themes, null, 2) + "\n");
  console.log(`✓ Built theme index: ${themes.length} themes → public/themes/index.json`);
  themes.forEach((t) => console.log(`  • ${t.name} (${t.id})`));
}

buildThemeIndex().catch((err) => {
  console.error("Failed to build theme index:", err);
  process.exit(1);
});
