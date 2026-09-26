import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project — a stray package.json exists higher
  // up (C:\Users\ganes), and without this Next infers the wrong root.
  turbopack: { root: import.meta.dirname },
  images: {
    // Remote editorial/product imagery (sample data) is served from Unsplash.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
