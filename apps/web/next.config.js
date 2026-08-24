import path from "node:path";

/**
 * In a pnpm workspace Next can mis-infer the file-tracing root and omit
 * workspace files from the serverless bundle (MODULE_NOT_FOUND at runtime).
 * Pinning it to the repo root avoids that. See DEPLOYMENT.md §1.5.
 */
const repoRoot = path.join(import.meta.dirname, "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
	outputFileTracingRoot: repoRoot,
	transpilePackages: ["@repo/ui"],
};

export default nextConfig;
