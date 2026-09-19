/**
 * Append-only administrative audit log.
 *
 * Every mutation in the admin API calls `recordAudit` inside the same D1
 * batch as the change itself, so an action can never be stored without its
 * record (or the record without the action). There is intentionally no
 * update/delete path — the table is the forensic trail.
 *
 * `summary` is a short human description of the change. It must never carry
 * secrets, access tokens, payment data or full customer payloads — callers
 * pass field names and entity identifiers, not raw bodies.
 */
export type AuditEnv = { DB: D1Database };

export function auditStatement(
  env: AuditEnv,
  actor: string,
  action: string,
  entityType: string,
  entityId: string,
  summary: string,
  now: string
): D1PreparedStatement {
  return env.DB.prepare(`
    INSERT INTO admin_audit_log (actor, action, entity_type, entity_id, summary, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(actor, action, entityType, entityId, summary.slice(0, 500), now);
}
