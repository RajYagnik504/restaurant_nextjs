const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_FE6kSc0gNLqT@ep-dry-tree-azxde4bc-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
});

async function main() {
  const mobile = '7999620244';
  const password = 'shivshakti@2000';
  const hash = await bcrypt.hash(password, 10);
  
  await pool.query(
    "UPDATE \"staff_users\" SET password_hash = $1 WHERE mobile = $2",
    [hash, mobile]
  );
  console.log("Password updated successfully.");
  pool.end();
}

main().catch(console.error);
