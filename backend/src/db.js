import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const cloudConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL.replace(/&?channel_binding=require/, ''),
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    };

export const pool = new Pool({ ...cloudConfig, max: 10 });

export const query = (text, params) => pool.query(text, params);
