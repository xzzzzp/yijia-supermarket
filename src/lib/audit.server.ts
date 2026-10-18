import "server-only";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import type { RowDataPacket } from "mysql2";
import { appendLocalAuditLog, readLocalAuditLogs } from "@/lib/local-data";
import { isMysqlConfigured, mysqlExecute, mysqlQuery } from "@/lib/mysql";
import type { AuditAction, AuditLogRecord } from "@/types/audit";

const SCHEMA_HINT =
  "操作日志表尚未建立。请在 MySQL 中执行 mysql/migrations/20261018_notifications_and_audit.sql，或重新执行 mysql/schema.sql。";

const LIST_LIMIT = 300;

interface AuditRow extends RowDataPacket {
  id: string;
  created_at: Date | string;
  actor_email: string;
  actor_staff_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  summary: string;
  ip: string | null;
}

export interface RecordAuditInput {
  actorEmail: string;
  actorStaffId: string | null;
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  summary: string;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max);
}

async function requestIp(): Promise<string | null> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    const candidate = forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip")?.trim() || "";
    return candidate ? clip(candidate, 64) : null;
  } catch {
    return null;
  }
}

function rowToAudit(row: AuditRow): AuditLogRecord {
  return {
    id: row.id,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    actorEmail: row.actor_email,
    actorStaffId: row.actor_staff_id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    summary: row.summary,
    ip: row.ip,
  };
}

export async function recordAudit(input: RecordAuditInput): Promise<void> {
  const actorEmail = clip(input.actorEmail, 255);
  const summary = clip(input.summary, 512);
  if (!actorEmail || !summary) return;

  const record: AuditLogRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    actorEmail,
    actorStaffId: input.actorStaffId,
    action: input.action,
    targetType: clip(input.targetType, 64),
    targetId: input.targetId ? clip(input.targetId, 255) : null,
    summary,
    ip: await requestIp(),
  };

  try {
    if (!isMysqlConfigured()) {
      await appendLocalAuditLog(record);
      return;
    }

    await mysqlExecute(
      `INSERT INTO audit_logs (
         id, created_at, actor_email, actor_staff_id, action, target_type, target_id, summary, ip
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        new Date(record.createdAt),
        record.actorEmail,
        record.actorStaffId,
        record.action,
        record.targetType,
        record.targetId,
        record.summary,
        record.ip,
      ],
    );
  } catch (err) {
    console.error("[audit] failed to write log:", err);
  }
}

export async function listAuditLogs(): Promise<{ logs: AuditLogRecord[]; warning?: string }> {
  try {
    if (!isMysqlConfigured()) {
      const logs = await readLocalAuditLogs();
      return {
        logs: logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, LIST_LIMIT),
      };
    }

    const rows = await mysqlQuery<AuditRow[]>(
      `SELECT id, created_at, actor_email, actor_staff_id, action, target_type, target_id, summary, ip
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT ${LIST_LIMIT}`,
    );
    return { logs: rows.map(rowToAudit) };
  } catch (err) {
    console.error("Failed to list audit logs:", err);
    return { logs: [], warning: SCHEMA_HINT };
  }
}
