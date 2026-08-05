import { Client } from 'pg';

async function main() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_FE6kSc0gNLqT@ep-dry-tree-azxde4bc-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  });
  
  await client.connect();

  const res = await client.query(`
    INSERT INTO staff_users (mobile, name, password_hash, role) 
    VALUES ('9999999999', 'Admin', 'admin', 'admin') 
    ON CONFLICT (mobile) DO NOTHING
    RETURNING id;
  `);

  console.log('Admin user seeded:', res.rows);
  await client.end();
}

main().catch(console.error);
