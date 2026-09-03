import type { NextConfig } from 'next';

const isTimewebStaticExport = process.env.TIMEWEB_STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  // Timeweb shared hosting serves static files and PHP, not a Node.js process.
  // The Timeweb release therefore exports the front end and adds a small PHP
  // relay for the already configured Bitrix24 delivery separately.
  ...(isTimewebStaticExport ? {
    output: 'export' as const,
    images: { unoptimized: true },
  } : {}),
  // The Codex workspace has a parent lockfile. Pin Turbopack to this project so
  // native Next.js builds (including Vercel) never absorb sibling middleware.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
