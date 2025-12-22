import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  transpilePackages: ["jstz-ui"],

  outputFileTracingIncludes: {
    "/api/market": ["./artifacts/**/*"],
  },

  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
