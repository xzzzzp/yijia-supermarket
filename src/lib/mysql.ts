import "server-only";

import mysql, { type Pool, type PoolOptions, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

export function isMysqlConfigured(): boolean {
  if (process.env.MYSQL_URL?.trim()) return true;
  return Boolean(
    process.env.MYSQL_HOST?.trim() &&
      process.env.MYSQL_DATABASE?.trim() &&
      process.env.MYSQL_USER?.trim(),
  );
}

let pool: Pool | null = null;

// DATETIME 没有时区。timezone "Z" 让驱动把读到的墙钟当成 UTC，写 Date 时也写成 UTC 墙钟。
// 连接串上若自带 timezone，mysql2 只在调用方没传该选项时才采用，因此这里显式传 "Z" 会盖过 URL。
// 会话 time_zone 再设成 +00:00，CURRENT_TIMESTAMP（商品、分类等默认值）写入的也是 UTC 墙钟。
// 只改驱动时区不会改变 MySQL 自己的 CURRENT_TIMESTAMP。
export const MYSQL_SESSION_TIME_ZONE_SQL = "SET time_zone = '+00:00'";

function poolOptions(): PoolOptions {
  const url = process.env.MYSQL_URL?.trim();
  // 握手字符集就是 SET NAMES。只传连接串时不会用到下面的 charset，
  // URL 上的 charset=latin1 会把 UTF-8 中文按 latin1 写进 utf8mb4 列。
  const charset = "utf8mb4";
  const timezone = "Z";
  if (url) {
    return { uri: url, charset, timezone };
  }
  return {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD ?? "",
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    charset,
    timezone,
  };
}

export function getMysqlPool(): Pool {
  if (!isMysqlConfigured()) {
    throw new Error("MySQL 未配置");
  }

  if (!pool) {
    const created = mysql.createPool(poolOptions());
    // 监听底层连接池：新连接在交给第一条业务 SQL 之前会先排队这条 SET。
    created.pool.on("connection", (connection) => {
      connection.query(MYSQL_SESSION_TIME_ZONE_SQL, (err) => {
        if (!err) return;
        console.error("[mysql] SET time_zone = '+00:00' failed:", err);
        connection.destroy();
      });
    });
    pool = created;
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
