const { Pool } = require('@neondatabase/serverless');
try {
  const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_FE6kSc0gNLqT@ep-dry-tree-azxde4bc-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' });
  console.log("Pool instantiated successfully!");
} catch (e) {
  console.error("Pool error:", e);
}
