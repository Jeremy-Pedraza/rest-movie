import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { validateEnvironment } from '@config/env.validation';

// Load environment variables
// En produccion prioriza api/.env.production (build output).
const envCandidates =
  process.env.NODE_ENV === 'production'
    ? ['api/.env.production', '.env.production', '.env']
    : [`.env.${process.env.NODE_ENV || 'development'}`, '.env'];

const envFile = envCandidates.find((candidate) =>
  fs.existsSync(path.resolve(process.cwd(), candidate)),
);
if (envFile) {
  config({ path: envFile });
} else {
  config();
}

validateEnvironment(process.env);

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../../database/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
