import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("deployment script", () => {
  it("defines the expected one-command deployment flow", async () => {
    const script = await readFile("scripts/deploy.sh", "utf8");
    const packageJson = JSON.parse(await readFile("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts.deploy).toBe("bash scripts/deploy.sh");
    expect(script).toContain("set -euo pipefail");
    expect(script).toContain('REMOTE_HOST="${REMOTE_HOST:-47.237.216.32}"');
    expect(script).toContain('REMOTE_USER="${REMOTE_USER:-root}"');
    expect(script).toContain('npm run build');
    expect(script).toContain("--exclude 'node_modules'");
    expect(script).toContain("--exclude 'dist'");
    expect(script).toContain("npm ci");
    expect(script).toContain("rsync -a --delete dist/");
    expect(script).toContain("nginx -t");
    expect(script).toContain("systemctl reload nginx");
  });
});
