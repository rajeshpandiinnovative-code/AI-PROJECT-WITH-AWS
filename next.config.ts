import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Absolute path to this repo (fixes wrong root when a parent folder has its own package-lock.json). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /* You can add standard config options here as you scale Pinnacle Software Solution */
  reactStrictMode: true,
  // Stops Next from inferring C:\Users\<you> as the workspace root when another lockfile exists there.
  outputFileTracingRoot: projectRoot,
  // Keeps Turbopack rooted to this app when you run without --webpack.
  turbopack: {
    root: projectRoot,
  },
  // Avoid Webpack filesystem cache lockfiles on some Windows/WSL/AV setups (reduces "acquire lockfile" IO errors).
  webpack(config, { dev }) {
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;