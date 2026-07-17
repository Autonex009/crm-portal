import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Monorepo has a single `.env` at the repo root (see CONTRIBUTING.md), but
// Next.js only auto-loads .env files from its own app directory (apps/web).
// Walk up to the workspace root (marked by pnpm-workspace.yaml) and load it.
function findWorkspaceRoot(startDir: string): string {
  let dir = startDir;
  while (!existsSync(join(dir, "pnpm-workspace.yaml"))) {
    const parent = dirname(dir);
    if (parent === dir) return startDir;
    dir = parent;
  }
  return dir;
}

// Next.js already calls loadEnvConfig(apps/web) internally before this file
// runs, finds no .env files there, and caches that result — so our call must
// force a reload (4th arg) or it's a silent no-op.
loadEnvConfig(findWorkspaceRoot(process.cwd()), process.env.NODE_ENV !== "production", undefined, true);

const nextConfig: NextConfig = {
  transpilePackages: ["@crm/types", "@crm/db"],
};

export default nextConfig;
