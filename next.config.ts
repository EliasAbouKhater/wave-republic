import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR + client scripts when the dev server is reached from LAN /
  // Tailscale IPs instead of localhost. Only affects development.
  allowedDevOrigins: [
    "10.10.10.10",
    "100.111.155.23",
    "*.ts.net",
  ],
  experimental: {
    serverActions: {
      // Server Actions cap request bodies at 1 MB by default, which silently
      // broke menu-photo uploads: anything over ~1 MB failed inside the
      // framework before uploadActions.ts validation ran, so the advertised
      // 5 MB limit was never actually reachable.
      //
      // Photos are compressed in the browser now (well under 1 MB typically);
      // this is headroom so an unusually detailed image still succeeds. Keep it
      // above MAX_BYTES in uploadActions.ts.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
