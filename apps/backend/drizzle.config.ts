import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './db/drizzle',
  schema: './db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    // Allow disabling TLS certificate verification for environments
    // where the Postgres server uses a self-signed cert (e.g. Aiven).
    // Set `PG_REJECT_UNAUTHORIZED=false` to disable verification.
    ...(process.env.PG_REJECT_UNAUTHORIZED === 'false'
      ? { ssl: { rejectUnauthorized: false } }
      : {}),
  },
});
