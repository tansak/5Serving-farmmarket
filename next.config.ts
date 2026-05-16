import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com/,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/api\/produce/,
        handler: "NetworkFirst",
        options: {
          cacheName: "produce-api",
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
        },
      },
      {
        urlPattern: /\/api\/farmers/,
        handler: "NetworkFirst",
        options: {
          cacheName: "farmers-api",
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
};

export default withPWA(nextConfig);
