import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La app depende de la sesión (cookies) en casi cada página, así que todo se
  // renderiza por petición. Cache Components queda apagado a propósito.
  cacheComponents: false,
  serverExternalPackages: ["unpdf", "mammoth"],
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;
