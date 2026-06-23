declare module "next-pwa" {
  import type { NextConfig } from "next";

  interface PWAOptions {
    dest: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    fallbacks?: {
      document?: string;
    };
  }

  export default function withPWAInit(
    options: PWAOptions,
  ): (nextConfig: NextConfig) => NextConfig;
}
