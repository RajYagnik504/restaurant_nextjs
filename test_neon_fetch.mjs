import { Pool, neonConfig } from '@neondatabase/serverless';
neonConfig.poolQueryViaFetch = true;

const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_FE6kSc0gNLqT@ep-dry-tree-azxde4bc-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' });

async function test() {
  try {
    const res = await pool.query('SELECT 1 as val');
    console.log("Success:", res.rows);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
