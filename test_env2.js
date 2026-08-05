const { Pool } = require('@neondatabase/serverless');

process.env.DATABASE_URL = "";

const pool = new Pool({ connectionString: "postgresql://valid" });

console.log("Pool connection string:", pool.options.connectionString);
