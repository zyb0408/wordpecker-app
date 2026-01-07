import { Pool } from 'pg';
import { environment } from './environment';

if (!environment.databaseUrl) {
  throw new Error('Missing Database configuration. Check DATABASE_URL in .env');
}

export const pool = new Pool({
  connectionString: environment.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL successfully');
    client.release();
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error);
    process.exit(1);
  }
};
