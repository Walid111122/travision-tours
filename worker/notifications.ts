export type NotificationChannel = 'email';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

/**
 * The payload handed to a notification adapter.
 *
 * It deliberately carries no customer name, email or phone number. The
 * operator identifies the inquiry by its reference and opens the protected
 * lead-review view for the personal detail, so notification logs never hold
 * full personal data.
 */
export type NotificationPayload = {
  bookingId: string;
  reference: string;
  channel: NotificationChannel;
  subject: string;
  summary: string;
  createdAt: string;
};

/** Provider-independent boundary between storing an inquiry and alerting. */
export interface NotificationAdapter {
  readonly name: string;
  send(payload: NotificationPayload): Promise<void>;
}

/** Local development: records the attempt and never sends a real message. */
export class LoggingNotificationAdapter implements NotificationAdapter {
  readonly name = 'logging';

  async send(payload: NotificationPayload): Promise<void> {
    console.log(
      JSON.stringify({
        message: 'notification_skipped_in_development',
        channel: payload.channel,
        reference: payload.reference,
        subject: payload.subject
      })
    );
  }
}

/**
 * Production with no provider configured. Throwing keeps the row in `failed`
 * so it shows up in the operator's unresolved list instead of being marked
 * sent when nothing was actually delivered.
 */
export class UnconfiguredNotificationAdapter implements NotificationAdapter {
  readonly name = 'unconfigured';

  async send(): Promise<void> {
    throw new Error('No notification provider is configured for this environment.');
  }
}

/**
 * Provider-agnostic HTTP adapter. Point `NOTIFICATION_WEBHOOK_URL` at the
 * approved provider (or at a relay) once the owner has chosen one; the secret
 * lives in Cloudflare, never in Git.
 */
export class WebhookNotificationAdapter implements NotificationAdapter {
  readonly name = 'webhook';

  constructor(
    private readonly url: string,
    private readonly token?: string
  ) {}

  async send(payload: NotificationPayload): Promise<void> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Notification provider responded with ${response.status}.`);
    }
  }
}

export type NotificationEnv = {
  DB: D1Database;
  ENVIRONMENT?: string;
  NOTIFICATION_WEBHOOK_URL?: string;
  NOTIFICATION_WEBHOOK_TOKEN?: string;
};

export function getNotificationAdapter(env: NotificationEnv): NotificationAdapter {
  if (env.NOTIFICATION_WEBHOOK_URL) {
    return new WebhookNotificationAdapter(
      env.NOTIFICATION_WEBHOOK_URL,
      env.NOTIFICATION_WEBHOOK_TOKEN
    );
  }
  // Only an explicit local development environment may no-op. Anything else —
  // including a misconfigured deployment — fails visibly instead of marking an
  // inquiry "sent" when nothing was delivered.
  if (env.ENVIRONMENT === 'development') {
    return new LoggingNotificationAdapter();
  }
  return new UnconfiguredNotificationAdapter();
}

export function buildNotificationPayload(params: {
  bookingId: string;
  reference: string;
  tourTitle: string;
  travelers: number;
  preferredDate: string;
  createdAt: string;
}): NotificationPayload {
  return {
    bookingId: params.bookingId,
    reference: params.reference,
    channel: 'email',
    subject: `New inquiry ${params.reference}`,
    summary: `${params.travelers} traveler(s) requested "${params.tourTitle}" from ${params.preferredDate}.`,
    createdAt: params.createdAt
  };
}

/**
 * The outbox row is added to the same D1 batch as the booking, so a stored
 * inquiry can never exist without a matching notification obligation.
 */
export function enqueueNotificationStatement(
  env: NotificationEnv,
  payload: NotificationPayload,
  now: string
): D1PreparedStatement {
  return env.DB.prepare(`
    INSERT INTO notification_outbox (
      booking_id, channel, status, attempts, payload, created_at, updated_at, next_attempt_at
    ) VALUES (?, ?, 'pending', 0, ?, ?, ?, ?)
  `).bind(
    payload.bookingId,
    payload.channel,
    JSON.stringify(payload),
    now,
    now,
    now
  );
}

type OutboxRow = {
  id: number;
  booking_id: string;
  channel: string;
  attempts: number;
  payload: string;
};

const MAX_BACKOFF_SECONDS = 3600;

/**
 * Retry-safe delivery. Called immediately after a booking is stored and again
 * from the scheduled handler, so a provider outage delays a notification
 * instead of losing it.
 */
export async function deliverPendingNotifications(
  env: NotificationEnv,
  limit = 10
): Promise<{ sent: number; failed: number }> {
  const adapter = getNotificationAdapter(env);
  const now = new Date().toISOString();

  const { results } = await env.DB.prepare(`
    SELECT id, booking_id, channel, attempts, payload
    FROM notification_outbox
    WHERE status IN ('pending', 'failed')
      AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
    ORDER BY id ASC
    LIMIT ?
  `)
    .bind(now, limit)
    .all<OutboxRow>();

  let sent = 0;
  let failed = 0;

  for (const row of results ?? []) {
    const attemptTime = new Date().toISOString();
    try {
      const payload = JSON.parse(row.payload) as NotificationPayload;
      await adapter.send(payload);

      await env.DB.prepare(`
        UPDATE notification_outbox
        SET status = 'sent', attempts = attempts + 1, last_error = NULL,
            sent_at = ?, updated_at = ?
        WHERE id = ?
      `)
        .bind(attemptTime, attemptTime, row.id)
        .run();
      sent += 1;
    } catch (error) {
      const attempts = row.attempts + 1;
      const backoffSeconds = Math.min(MAX_BACKOFF_SECONDS, 30 * 2 ** Math.min(attempts, 7));
      const nextAttemptAt = new Date(Date.now() + backoffSeconds * 1000).toISOString();

      await env.DB.prepare(`
        UPDATE notification_outbox
        SET status = 'failed', attempts = ?, last_error = ?, updated_at = ?,
            next_attempt_at = ?
        WHERE id = ?
      `)
        .bind(
          attempts,
          (error instanceof Error ? error.message : 'Unknown notification error.').slice(0, 500),
          attemptTime,
          nextAttemptAt,
          row.id
        )
        .run();
      failed += 1;
    }
  }

  if (sent || failed) {
    console.log(
      JSON.stringify({ message: 'notification_outbox_processed', adapter: adapter.name, sent, failed })
    );
  }

  return { sent, failed };
}
