import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR + client scripts when the dev server is reached from LAN /
  // Tailscale IPs instead of localhost. Only affects development.
  allowedDevOrigins: [
    "10.10.10.10",
    "100.111.155.23",
    "*.ts.net",
  ],
};

export default nextConfig;
