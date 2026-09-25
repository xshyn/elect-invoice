import type { NextConfig } from 'next';

// `standalone` output is only for the Docker image. Vercel manages its own
// output mode — setting `standalone` there is redundant, so the Dockerfile
// builder sets DOCKER_STANDALONE=1 to opt in.
const nextConfig: NextConfig = {
  ...(process.env.DOCKER_STANDALONE === '1' ? { output: 'standalone' as const } : {}),
};

export default nextConfig;
