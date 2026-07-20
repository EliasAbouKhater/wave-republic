/**
 * Prisma 7 moved connection config out of schema.prisma. Migrations use
 * DIRECT_URL (uncached direct connection), the app runtime uses the pooled
 * DATABASE_URL via PrismaPg in `src/lib/db.ts`.
 */
import "dotenv/config";
import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
