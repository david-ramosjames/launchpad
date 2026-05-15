import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mcusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
