import { requireAdmin } from "@/lib/admin-auth";
import { listAuditLogs } from "@/lib/audit.server";
import { formatTashkentDate } from "@/lib/tashkent-time";
import { auditActionLabel, auditTargetLabel } from "@/types/audit";
import { AccessDenied } from "@/components/admin/AccessDenied";

export default async function AdminAuditLogsPage() {
  const user = await requireAdmin();
  if (!user.isOwner) {
    return <AccessDenied message="仅店主可以查看操作日志。" />;
  }

  const { logs, warning } = await listAuditLogs(user);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">操作日志</h1>
        <p className="mt-1 text-sm leading-6 break-words text-slate-600">
          记录登录成功和失败、商品新增/更新/删除/导入/上传图片、分类变更、订单状态变更、店员变更和店铺设置保存。
        </p>
      </div>
      {warning && (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 break-words text-amber-950">
          {warning}
        </p>
      )}
      {!logs.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
          暂无操作记录。
        </div>
      ) : (
        <>
        <div className="space-y-3 md:hidden">
          {logs.map((log) => (
            <article key={log.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-600">{formatTashkentDate(log.createdAt, { withSeconds: true })}</p>
              <p className="mt-2 font-semibold break-words text-slate-900">{log.actorEmail}</p>
              {log.actorStaffId ? (
                <p className="mt-1 font-mono text-xs leading-5 break-all text-slate-500">{log.actorStaffId}</p>
              ) : null}
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-slate-500">动作</dt>
                  <dd className="mt-0.5 leading-6 font-medium break-words text-slate-900">
                    {auditActionLabel(log.action)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">对象</dt>
                  <dd className="mt-0.5 leading-6 break-words text-slate-800">{auditTargetLabel(log.targetType)}</dd>
                  {log.targetId ? (
                    <p className="mt-1 font-mono text-xs leading-5 break-all text-slate-500">{log.targetId}</p>
                  ) : null}
                </div>
                <div>
                  <dt className="text-slate-500">摘要</dt>
                  <dd className="mt-0.5 leading-6 break-words text-slate-800">{log.summary}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="shrink-0 text-slate-500">IP</dt>
                  <dd className="min-w-0 text-right break-all text-slate-600">{log.ip || "—"}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">时间</th>
                  <th className="px-4 py-3 font-semibold">操作人</th>
                  <th className="px-4 py-3 font-semibold">动作</th>
                  <th className="px-4 py-3 font-semibold">对象</th>
                  <th className="px-4 py-3 font-semibold">摘要</th>
                  <th className="px-4 py-3 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 align-top last:border-b-0">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                      {formatTashkentDate(log.createdAt, { withSeconds: true })}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      <div>{log.actorEmail}</div>
                      {log.actorStaffId && (
                        <div className="mt-1 font-mono text-xs text-slate-500">{log.actorStaffId}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-800">{auditActionLabel(log.action)}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{auditTargetLabel(log.targetType)}</div>
                      {log.targetId && <div className="mt-1 font-mono text-xs text-slate-500">{log.targetId}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-800">{log.summary}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">{log.ip || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </>
  );
}
