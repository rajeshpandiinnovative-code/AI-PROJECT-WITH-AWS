import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * AWS RDS requires SSL. In a local development environment, 
 * we set rejectUnauthorized to false to allow the RDS self-signed certificate.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // This bypasses the SELF_SIGNED_CERT_IN_CHAIN error
  },
});

export const db = drizzle(pool, { schema });