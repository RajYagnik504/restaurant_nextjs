const { Pool } = require('@neondatabase/serverless');

process.env.DATABASE_URL = "postgres://invalid:invalid@invalid/invalid";

// Pass a valid connection string in options
const pool = new Pool({ connectionString: "postgresql://neondb_owner:npg_FE6kSc0gNLqT@ep-dry-tree-azxde4bc-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" });

console.log("Pool connection string:", pool.options.connectionString);
