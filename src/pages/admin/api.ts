/**
 * Admin API client. Every call goes to /api/admin/*, which requires a
 * verified Cloudflare Access identity — the browser never holds a token;
 * Access injects the assertion at the edge. `credentials: 'same-origin'`
 * carries the CF_Authorization cookie and nothing else.
 */

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin${path}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init
  });

  if (response.status === 401 || response.status === 403) {
    window.dispatchEvent(new CustomEvent('admin:unauthorized'));
    throw new AdminApiError('Your operator session has expired — sign in again.', response.status);
  }

  const body = (await response.json().catch(() => null)) as
    | (T & { error?: { code?: string; message?: string } })
    | null;

  if (!response.ok) {
    throw new AdminApiError(
      body?.error?.message || `Request failed with status ${response.status}.`,
      response.status,
      body?.error?.code
    );
  }
  return body as T;
}

/** Upload helper — raw image bytes, not JSON. */
export async function adminUpload<T>(path: string, file: File): Promise<T> {
  const response = await fetch(`/api/admin${path}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': file.type },
    body: file
  });
  const body = (await response.json().catch(() => null)) as
    | (T & { error?: { code?: string; message?: string } })
    | null;
  if (!response.ok) {
    throw new AdminApiError(
      body?.error?.message || `Upload failed with status ${response.status}.`,
      response.status,
      body?.error?.code
    );
  }
  return body as T;
}

export interface SessionInfo {
  authorized: boolean;
  email: string;
  devBypass: boolean;
  environment: string;
}

export interface CmsTourSummary {
  id: string;
  collection: string;
  status: string;
  revision: number;
  published_revision_no: number | null;
  title: string;
  destination: string;
  category: string;
  duration: string;
  price: number | null;
  currency: string;
  cover_image: string;
  updated_by: string;
  updated_at: string;
  released_at: string | null;
}

export interface CmsPostSummary {
  id: string;
  slug: string;
  status: string;
  revision: number;
  published_revision_no: number | null;
  title: string;
  author: string;
  published_at: string | null;
  scheduled_at: string | null;
  updated_by: string;
  updated_at: string;
  released_at: string | null;
}

export interface QuotationSummary {
  id: string;
  reference: string;
  booking_id: string | null;
  status: string;
  version_no: number;
  revision: number;
  sent_version_no: number | null;
  customer_name: string;
  total_price: string;
  sent_at: string | null;
  updated_by: string;
  updated_at: string;
  created_at: string;
}

export interface MediaAsset {
  id: string;
  object_key: string;
  filename: string;
  mime: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt: string;
  status: string;
  url: string;
  created_by: string;
  created_at: string;
}

export interface AuditEntry {
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  summary: string;
  created_at: string;
}

export interface RevisionEntry {
  revision_no: number;
  version_no?: number;
  status?: string;
  entity_type?: string;
  entity_id?: string;
  summary: string;
  actor: string;
  created_at: string;
}

export interface OverviewCounts {
  toursPublished: number;
  toursDraft: number;
  toursArchived: number;
  postsPublished: number;
  postsDraft: number;
  postsScheduled: number;
  newInquiries: number;
  quotationsDraft: number;
  quotationsReady: number;
  quotationsSent: number;
  quotationsAccepted: number;
  quotationsAwaitingPayment: number;
  confirmedReservations: number;
  contentMissingFields: number;
  activeMedia: number;
}
