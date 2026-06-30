import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Build sırasında TypeScript hatalarını yoksay
    ignoreBuildErrors: true,
  },
};

export default nextConfig;