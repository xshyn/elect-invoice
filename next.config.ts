import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output for Docker deployment (server + Postgres, not static hosting).
  output: 'standalone',
};

export default nextConfig;
