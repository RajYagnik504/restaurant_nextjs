const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_FE6kSc0gNLqT@ep-dry-tree-azxde4bc-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
});

async function check() {
  const res = await pool.query("SELECT * FROM \"staff_users\" WHERE mobile = '7999620244'");
  console.log("Users found:", res.rows);
  pool.end();
}

check().catch(console.error);
