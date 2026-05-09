import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", override: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const useAwsRds = connectionString.includes("rds.amazonaws.com");
const sql = postgres(connectionString, {
  max: 1,
  prepare: false,
  connect_timeout: 30,
  idle_timeout: 20,
  onnotice: () => {},
  ...(useAwsRds ? { ssl: { rejectUnauthorized: false } } : {}),
});

try {
  const rows = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('intervention_tasks','intervention_audit_logs','intervention_daily_digests')
    order by table_name
  `;
  console.log("TABLES=" + rows.map((row) => row.table_name).join(","));
} catch (error) {
  console.error("Table verification failed:", error);
  process.exit(1);
} finally {
  await sql.end({ timeout: 10 });
}
