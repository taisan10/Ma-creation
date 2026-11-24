import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  
  async headers() {
  return [
    {
      source: "/(.*)", // 1. Poori Website Par Lagu Hoga
      headers: [
        { key: "X-Frame-Options", value: "DENY" }, // 2. Clickjacking Defense
        { key: "X-Content-Type-Options", value: "nosniff" }, // 3. MIME Sniffing Block
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, // 4. URL Privacy
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }, // 5. Hardware Lock
      ],
    },
  ];
},
  /* Express Backend Reverse Proxy */
  async rewrites(){
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
