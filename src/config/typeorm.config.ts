import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

const parseIntegerEnv = (name: string, defaultValue: number): number => {
  const value = Number.parseInt(process.env[name] || '', 10);
  return Number.isInteger(value) ? value : defaultValue;
};

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'smokeguard',
  entities: [__dirname + '/../database/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  extra: {
    max: parseIntegerEnv('DB_POOL_MAX', 10),
    min: parseIntegerEnv('DB_POOL_MIN', 0),
    idleTimeoutMillis: parseIntegerEnv('DB_POOL_IDLE_TIMEOUT_MS', 10000),
    connectionTimeoutMillis: parseIntegerEnv('DB_POOL_CONNECTION_TIMEOUT_MS', 5000),
  },
};

const dataSource = new DataSource(typeOrmConfig);

export default dataSource;
