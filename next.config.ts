import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: ".supabase.co", pathname: "/storage/*" },
    ],
  },
  // 👇 Added to fix "Body exceeded 1 MB limit" error
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // Allows file uploads up to 5MB
    },
  },
};

export default nextConfig;
