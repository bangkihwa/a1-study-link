import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  connectionLimit: number;
}

const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'a1_studylink',
  port: parseInt(process.env.DB_PORT || '3306'),
  connectionLimit: 10
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 연결 풀을 즉시 생성합니다.
export const pool = mysql.createPool(dbConfig);
console.log('📚 Database connection pool created');

/**
 * 기존 코드 호환을 위한 커넥션 초기화 헬퍼.
 * 풀을 생성한 뒤 동일 인스턴스를 반환한다.
 */
export const createConnection = () => pool;

export const waitForDatabase = async (options?: {
  retries?: number;
  delayMs?: number;
}) => {
  const { retries = 20, delayMs = 2000 } = options || {};

  for (let attempt = 1; attempt <= retries; attempt++) {
    let connection: mysql.PoolConnection | undefined;
    try {
      connection = await pool.getConnection();
      await connection.ping();
      connection.release();

      if (attempt > 1) {
        console.log(`✅ Database became available after ${attempt} attempts`);
      }

      return;
    } catch (error) {
      if (connection) {
        connection.release();
      }
      if (attempt === 1) {
        console.log('⏳ Waiting for database to become ready...');
      } else {
        console.log(`⏳ Database not ready yet (attempt ${attempt}/${retries})`);
      }

      if (attempt === retries) {
        console.error('❌ Database did not become ready within the expected time');
        throw error;
      }

      await delay(delayMs);
    }
  }
};

export const getConnection = async () => {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
};

export const query = async (sql: string, params?: any[]) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};

export default { getConnection, query, pool, createConnection, waitForDatabase };
