import "server-only";

import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

export function isMysqlConfigured(): boolean {
  if (process.env.MYSQL_URL?.trim()) return true;
  return Boolean(
    process.env.MYSQL_HOST?.trim() &&
      process.env.MYSQL_DATABASE?.trim() &&
      process.env.MYSQL_USER?.trim(),
  );
}

let pool: Pool | null = null;

export function getMysqlPool(): Pool {
  if (!isMysqlConfigured()) {
    throw new Error("MySQL 未配置");
  }

  if (!pool) {
    const url = process.env.MYSQL_URL?.trim();
    pool = url
      ? mysql.createPool(url)
      : mysql.createPool({
          host: process.env.MYSQL_HOST,
          port: Number(process.env.MYSQL_PORT || 3306),
          user: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASSWORD ?? "",
          database: process.env.MYSQL_DATABASE,
          waitForConnections: true,
          connectionLimit: 10,
          charset: "utf8mb4",
          timezone: "Z",
        });
  }

  return pool;
}

export async function mysqlQuery<T extends RowDataPacket[]>(
  sql: string,
  params: unknown[] = [],
): Promise<T> {
  const [rows] = await getMysqlPool().query<T>(sql, params);
  return rows;
}

export async function mysqlExecute(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  const [result] = await getMysqlPool().query<ResultSetHeader>(sql, params);
  return result;
}
