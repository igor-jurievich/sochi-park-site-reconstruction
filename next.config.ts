import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The Codex workspace has a parent lockfile. Pin Turbopack to this project so
  // native Next.js builds (including Vercel) never absorb sibling middleware.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
