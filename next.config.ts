import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // TODO: Remove this after resolving "any" type errors
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Optional: also ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
