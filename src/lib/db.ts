import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Next dev hot-reloads modules; a fresh PrismaClient each time exhausts DB connections.
declare global {
  var _dreamlandPrisma: PrismaClient | undefined;
}

function makeClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it to .env or the deployment secrets.");

  // Neon's pooled endpoint aggressively closes idle connections; give the
  // socket generous keepalives and cap the pool size so we don't hold too
  // many sockets open in serverless.
  const adapter = new PrismaPg({
    connectionString: url,
    max: 5,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const db = globalThis._dreamlandPrisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalThis._dreamlandPrisma = db;
}
