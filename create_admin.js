const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_FE6kSc0gNLqT@ep-dry-tree-azxde4bc-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
});

async function main() {
  const mobile = '7999620244';
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  
  // Check if exists
  const res = await pool.query("SELECT id FROM \"staff_users\" WHERE mobile = $1", [mobile]);
  if (res.rows.length === 0) {
    await pool.query(
      "INSERT INTO \"staff_users\" (mobile, password_hash, name, role) VALUES ($1, $2, $3, $4)",
      [mobile, hash, 'Admin User', 'admin']
    );
    console.log("Admin user created successfully.");
  } else {
    await pool.query(
      "UPDATE \"staff_users\" SET password_hash = $1 WHERE mobile = $2",
      [hash, mobile]
    );
    console.log("Admin user password updated successfully.");
  }
  pool.end();
}

main().catch(console.error);
