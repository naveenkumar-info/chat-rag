import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack polling (Next.js 15/16)
  experimental: {
    // Some versions use this flag for docker sync
    turbopackFileSystemCacheForDev: true, 
  },
  // Webpack polling fallback
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;