import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino", "thread-stream"],
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ["welcome-primate-specially.ngrok-free.app", "pinv.app"],
};

export default nextConfig;
