import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  transpilePackages: ["jstz-ui"],

  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
