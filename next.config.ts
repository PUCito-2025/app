import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // Ignorar errores de ESLint durante la construcción
  },
};

export default nextConfig;
