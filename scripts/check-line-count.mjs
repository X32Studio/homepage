import { readdir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const root = process.cwd();
const maxLines = 500;
const ignoredDirs = new Set([".astro", ".git", "dist", "node_modules"]);
const checkedExtensions = new Set([
  ".astro",
  ".css",
  ".js",
  ".jsx",
  ".mjs",
  ".ts",
  ".tsx",
]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) {
      continue;
    }

    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
      continue;
    }

    if (checkedExtensions.has(extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = await collectFiles(root);
const oversized = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  const lineCount = content.split(/\r?\n/).length;

  if (lineCount > maxLines) {
    oversized.push({ file, lineCount });
  }
}

if (oversized.length > 0) {
  for (const item of oversized) {
    console.error(`${item.file} has ${item.lineCount} lines`);
  }

  process.exit(1);
}

console.log(`Checked ${files.length} code files. All are <= ${maxLines} lines.`);
