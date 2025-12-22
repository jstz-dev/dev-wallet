import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  transpilePackages: ["jstz-ui"],

  outputFileTracingIncludes: {
    "/api/market": ["./artifacts/**/*"],
  },
};

export default nextConfig;
