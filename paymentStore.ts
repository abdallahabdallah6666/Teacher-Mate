import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import { Connector, IpAddressTypes } from '@google-cloud/cloud-sql-connector';

export type PaymentOrder = {
  orderId: string;
  checkoutId?: string;
  checkoutUrl?: string;
  planId: string;
  userEmail: string;
  userName: string;
  amount: number;
  licenseKey?: string;
  licenseSeatLicenseId?: string;
  resendEmailId?: string;
  status: 'creating' | 'pending' | 'paid' | 'failed';
  checkoutStatus: 'creating' | 'active' | 'failed' | 'unknown';
  fulfillmentStatus:
    | 'pending'
    | 'license_creation_started'
    | 'license_creation_unknown'
    | 'license_created'
    | 'email_sending'
    | 'email_delivery_unknown'
    | 'email_sent';
  checkoutCreateStartedAt?: string;
  licenseCreateStartedAt?: string;
  emailSendStartedAt?: string;
  processingLeaseUntil?: number;
  createdAt: string;
  updatedAt?: string;
};

export type ClaimResult = 'acquired' | 'completed' | 'busy';

export interface PaymentStore {
  createOrder(order: PaymentOrder): Promise<void>;
  getOrder(orderId: string): Promise<PaymentOrder | undefined>;
  getOrderByCheckoutId(checkoutId: string): Promise<PaymentOrder | undefined>;
  updateOrder(orderId: string, patch: Partial<PaymentOrder>): Promise<void>;
  claimEvent(eventId: string, eventType: string, leaseMs: number): Promise<ClaimResult>;
  completeEvent(eventId: string): Promise<void>;
  releaseEvent(eventId: string): Promise<void>;
  claimOrder(orderId: string, leaseMs: number): Promise<'acquired' | 'busy'>;
  releaseOrder(orderId: string): Promise<void>;
  ping(): Promise<void>;
  close(): Promise<void>;
}

const now = () => new Date().toISOString();
const defined = <T extends object>(value: T): T => Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;

const CREATE_ORDERS = `
  CREATE TABLE IF NOT EXISTS teacher_mate_payment_orders (
    order_id UUID PRIMARY KEY,
    checkout_id TEXT UNIQUE,
    order_data JSONB NOT NULL,
    processing_lease_until BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
const CREATE_EVENTS = `
  CREATE TABLE IF NOT EXISTS teacher_mate_chargily_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,
    lease_until BIGINT NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

export class PostgresPaymentStore implements PaymentStore {
  constructor(private readonly pool: Pool, private readonly connector?: Connector) {
    this.pool.on('error', error => console.error('Unexpected PostgreSQL pool error:', safeError(error)));
  }

  async initialize(): Promise<void> {
    await this.pool.query(CREATE_ORDERS);
    await this.pool.query(CREATE_EVENTS);
  }

  private async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async createOrder(order: PaymentOrder): Promise<void> {
    await this.pool.query(
      'INSERT INTO teacher_mate_payment_orders (order_id, order_data, created_at, updated_at) VALUES ($1, $2::jsonb, NOW(), NOW())',
      [order.orderId, JSON.stringify(order)]
    );
  }

  async getOrder(orderId: string): Promise<PaymentOrder | undefined> {
    const result = await this.pool.query<{ order_data: PaymentOrder }>(
      'SELECT order_data FROM teacher_mate_payment_orders WHERE order_id = $1', [orderId]
    );
    return result.rows[0]?.order_data;
  }

  async getOrderByCheckoutId(checkoutId: string): Promise<PaymentOrder | undefined> {
    const result = await this.pool.query<{ order_data: PaymentOrder }>(
      'SELECT order_data FROM teacher_mate_payment_orders WHERE checkout_id = $1', [checkoutId]
    );
    return result.rows[0]?.order_data;
  }

  async updateOrder(orderId: string, patch: Partial<PaymentOrder>): Promise<void> {
    await this.transaction(async client => {
      const result = await client.query<{ order_data: PaymentOrder }>(
        'SELECT order_data FROM teacher_mate_payment_orders WHERE order_id = $1 FOR UPDATE', [orderId]
      );
      const current = result.rows[0]?.order_data;
      if (!current) throw new Error('Payment order not found.');
      const updated = { ...current, ...defined(patch), updatedAt: now() };
      await client.query(
        'UPDATE teacher_mate_payment_orders SET checkout_id = $2, order_data = $3::jsonb, updated_at = NOW() WHERE order_id = $1',
        [orderId, updated.checkoutId || null, JSON.stringify(updated)]
      );
    });
  }

  async claimEvent(eventId: string, eventType: string, leaseMs: number): Promise<ClaimResult> {
    return this.transaction(async client => {
      const inserted = await client.query(
        `INSERT INTO teacher_mate_chargily_events (event_id,event_type,status,lease_until,attempts,updated_at)
         VALUES ($1,$2,'processing',$3,1,NOW()) ON CONFLICT (event_id) DO NOTHING RETURNING event_id`,
        [eventId, eventType, Date.now() + leaseMs]
      );
      if (inserted.rowCount) return 'acquired';
      const existing = await client.query<{ status: string; lease_until: string | number }>(
        'SELECT status, lease_until FROM teacher_mate_chargily_events WHERE event_id = $1 FOR UPDATE', [eventId]
      );
      const row = existing.rows[0];
      if (!row) throw new Error('Unable to claim webhook event.');
      if (row.status === 'completed') return 'completed';
      if (Number(row.lease_until) > Date.now()) return 'busy';
      await client.query(
        `UPDATE teacher_mate_chargily_events SET event_type=$2,status='processing',lease_until=$3,attempts=attempts+1,updated_at=NOW() WHERE event_id=$1`,
        [eventId, eventType, Date.now() + leaseMs]
      );
      return 'acquired';
    });
  }

  async completeEvent(eventId: string): Promise<void> {
    await this.pool.query(
      "UPDATE teacher_mate_chargily_events SET status='completed',lease_until=0,updated_at=NOW() WHERE event_id=$1", [eventId]
    );
  }

  async releaseEvent(eventId: string): Promise<void> {
    await this.pool.query('UPDATE teacher_mate_chargily_events SET lease_until=0,updated_at=NOW() WHERE event_id=$1', [eventId]);
  }

  async claimOrder(orderId: string, leaseMs: number): Promise<'acquired' | 'busy'> {
    return this.transaction(async client => {
      const row = await client.query<{ processing_lease_until: string | number }>(
        'SELECT processing_lease_until FROM teacher_mate_payment_orders WHERE order_id=$1 FOR UPDATE', [orderId]
      );
      if (!row.rows[0]) throw new Error('Payment order not found.');
      if (Number(row.rows[0].processing_lease_until) > Date.now()) return 'busy';
      await client.query('UPDATE teacher_mate_payment_orders SET processing_lease_until=$2,updated_at=NOW() WHERE order_id=$1', [orderId, Date.now() + leaseMs]);
      return 'acquired';
    });
  }

  async releaseOrder(orderId: string): Promise<void> {
    await this.pool.query('UPDATE teacher_mate_payment_orders SET processing_lease_until=0,updated_at=NOW() WHERE order_id=$1', [orderId]);
  }

  async ping(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  async close(): Promise<void> {
    await this.pool.end();
    this.connector?.close();
  }
}

/** In-memory adapter is available only to mocked tests. */
export class MemoryPaymentStore implements PaymentStore {
  private readonly orders = new Map<string, PaymentOrder>();
  private readonly events = new Map<string, { status: string; leaseUntil: number; attempts: number }>();

  async createOrder(order: PaymentOrder): Promise<void> {
    if (this.orders.has(order.orderId)) throw new Error('Payment order already exists.');
    this.orders.set(order.orderId, { ...order });
  }

  async getOrder(id: string): Promise<PaymentOrder | undefined> {
    const order = this.orders.get(id);
    return order && { ...order };
  }

  async getOrderByCheckoutId(id: string): Promise<PaymentOrder | undefined> {
    const order = [...this.orders.values()].find(value => value.checkoutId === id);
    return order && { ...order };
  }

  async updateOrder(id: string, patch: Partial<PaymentOrder>): Promise<void> {
    const order = this.orders.get(id);
    if (!order) throw new Error('Payment order not found.');
    this.orders.set(id, { ...order, ...defined(patch), updatedAt: now() });
  }

  async claimEvent(id: string, _type: string, leaseMs: number): Promise<ClaimResult> {
    const e = this.events.get(id);
    if (e?.status === 'completed') return 'completed';
    if (e && e.leaseUntil > Date.now()) return 'busy';
    this.events.set(id, { status: 'processing', leaseUntil: Date.now() + leaseMs, attempts: (e?.attempts || 0) + 1 });
    return 'acquired';
  }

  async completeEvent(id: string): Promise<void> {
    const e = this.events.get(id);
    this.events.set(id, { status: 'completed', leaseUntil: 0, attempts: e?.attempts || 1 });
  }

  async releaseEvent(id: string): Promise<void> {
    const e = this.events.get(id);
    if (e) this.events.set(id, { ...e, leaseUntil: 0 });
  }

  async claimOrder(id: string, leaseMs: number): Promise<'acquired' | 'busy'> {
    const order = this.orders.get(id);
    if (!order) throw new Error('Payment order not found.');
    if (Number(order.processingLeaseUntil || 0) > Date.now()) return 'busy';
    order.processingLeaseUntil = Date.now() + leaseMs;
    return 'acquired';
  }

  async releaseOrder(id: string): Promise<void> {
    const order = this.orders.get(id);
    if (order) order.processingLeaseUntil = 0;
  }

  async ping(): Promise<void> {}
  async close(): Promise<void> {}
}

export const PAYMENT_LEASE_MS = 120_000;
export const RESEND_IDEMPOTENCY_WINDOW_MS = 23 * 60 * 60 * 1000;

export async function createPaymentStore(): Promise<PaymentStore> {
  if (process.env.NODE_ENV === 'test') return new MemoryPaymentStore();
  const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME?.trim();
  const user = process.env.DB_USER?.trim();
  const database = process.env.DB_NAME?.trim();
  const password = process.env.DB_PASS;
  if (!instanceConnectionName || !user || !database || !password) {
    throw new Error('INSTANCE_CONNECTION_NAME, DB_USER, DB_NAME and DB_PASS are required for persistent payment storage.');
  }
  const connector = new Connector();
  try {
    const ipType = process.env.CLOUD_SQL_IP_TYPE?.toUpperCase() === 'PRIVATE' ? IpAddressTypes.PRIVATE : IpAddressTypes.PUBLIC;
    const clientOptions = await connector.getOptions({ instanceConnectionName, ipType });
    const pool = new Pool({ ...clientOptions, user, password, database, max: 5, connectionTimeoutMillis: 10_000, idleTimeoutMillis: 30_000 });
    const store = new PostgresPaymentStore(pool, connector);
    await store.initialize();
    return store;
  } catch (error) {
    connector.close();
    throw error;
  }
}

export function needsManualReconciliation(order: PaymentOrder): boolean {
  return order.checkoutStatus === 'unknown'
    || order.fulfillmentStatus === 'license_creation_unknown'
    || order.fulfillmentStatus === 'email_delivery_unknown';
}

export function isStaleAttempt(value: string | undefined): boolean {
  const ms = value ? Date.parse(value) : NaN;
  return !Number.isFinite(ms) || Date.now() - ms >= PAYMENT_LEASE_MS;
}

export function resendRetryIsSafe(startedAt: string | undefined): boolean {
  const ms = startedAt ? Date.parse(startedAt) : NaN;
  return Number.isFinite(ms) && Date.now() - ms < RESEND_IDEMPOTENCY_WINDOW_MS;
}

export function definitiveLicenseFailure(status: number): boolean {
  return [400, 401, 403, 404, 422].includes(status);
}

export function definitiveCheckoutFailure(status: number): boolean {
  return status >= 400 && status < 500;
}

export function providerStatus(error: unknown): number | undefined {
  const e = error as { status?: unknown; statusCode?: unknown } | null;
  const status = e?.status ?? e?.statusCode;
  return typeof status === 'number' ? status : undefined;
}

export function safeError(error: unknown): string {
  const text = error instanceof Error ? error.message : 'Unknown error';
  return text.replace(/(?:Bearer\s+|sk_(?:test|live)_|re_)[A-Za-z0-9._-]+/gi, '[redacted]').slice(0, 200);
}

export function emailIdempotencyKey(orderId: string): string {
  return `teacher-mate-license-${orderId}`;
}

export function metadataMatches(order: PaymentOrder, checkout: Record<string, unknown>, metadata: Record<string, unknown>): boolean {
  return order.orderId === metadata.orderId
    && order.planId === metadata.planId
    && order.userEmail === String(metadata.userEmail || '').trim().toLowerCase()
    && (!order.checkoutId || order.checkoutId === checkout.id);
}

export function validOrderId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value);
}

export function safeEventId(value: unknown): boolean {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 && !value.includes('/');
}

export function safeCustomerName(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 160) : '';
}

export function safeCustomerEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 320 && /^\S+@\S+\.\S+$/.test(value.trim());
}
