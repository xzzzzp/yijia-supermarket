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
    // 握手字符集就是 SET NAMES。只传连接串时不会用到下面的 charset，
    // URL 上的 charset=latin1 会把 UTF-8 中文按 latin1 写进 utf8mb4 列。
    const charset = "utf8mb4";
    pool = url
      ? mysql.createPool({ uri: url, charset })
      : mysql.createPool({
          host: process.env.MYSQL_HOST,
          port: Number(process.env.MYSQL_PORT || 3306),
          user: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASSWORD ?? "",
          database: process.env.MYSQL_DATABASE,
          waitForConnections: true,
          connectionLimit: 10,
          charset,
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
