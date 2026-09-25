import { Firestore } from '@google-cloud/firestore';
import type { CollectionReference } from '@google-cloud/firestore';

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
}

const now = () => new Date().toISOString();
const defined = <T extends object>(value: T): T => Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;

export class FirestorePaymentStore implements PaymentStore {
  private readonly db: Firestore;
  private readonly orders: CollectionReference;
  private readonly events: CollectionReference;

  constructor(projectId: string) {
    this.db = new Firestore({ projectId });
    this.orders = this.db.collection('teacherMatePaymentOrders');
    this.events = this.db.collection('teacherMateChargilyEvents');
  }

  async createOrder(order: PaymentOrder): Promise<void> {
    await this.db.runTransaction(async tx => {
      const ref = this.orders.doc(order.orderId);
      if ((await tx.get(ref)).exists) throw new Error('Payment order already exists.');
      tx.create(ref, { ...order, updatedAt: now(), schemaVersion: 1 });
    });
  }

  async getOrder(id: string): Promise<PaymentOrder | undefined> {
    const doc = await this.orders.doc(id).get();
    return doc.exists ? doc.data() as PaymentOrder : undefined;
  }

  async getOrderByCheckoutId(id: string): Promise<PaymentOrder | undefined> {
    const result = await this.orders.where('checkoutId', '==', id).limit(1).get();
    return result.empty ? undefined : result.docs[0].data() as PaymentOrder;
  }

  async updateOrder(id: string, patch: Partial<PaymentOrder>): Promise<void> {
    await this.db.runTransaction(async tx => {
      const ref = this.orders.doc(id);
      if (!(await tx.get(ref)).exists) throw new Error('Payment order not found.');
      tx.set(ref, { ...defined(patch), updatedAt: now() }, { merge: true });
    });
  }

  async claimEvent(id: string, type: string, leaseMs: number): Promise<ClaimResult> {
    const ref = this.events.doc(id);
    return this.db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const data = snap.data();
      if (data?.status === 'completed') return 'completed';
      if (Number(data?.leaseUntil || 0) > Date.now()) return 'busy';
      tx.set(ref, { eventType: type, status: 'processing', leaseUntil: Date.now() + leaseMs, attempts: Number(data?.attempts || 0) + 1, updatedAt: now() }, { merge: true });
      return 'acquired';
    });
  }

  async completeEvent(id: string): Promise<void> {
    await this.events.doc(id).set({ status: 'completed', leaseUntil: 0, updatedAt: now() }, { merge: true });
  }

  async releaseEvent(id: string): Promise<void> {
    await this.events.doc(id).set({ leaseUntil: 0, updatedAt: now() }, { merge: true });
  }

  async claimOrder(id: string, leaseMs: number): Promise<'acquired' | 'busy'> {
    const ref = this.orders.doc(id);
    return this.db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error('Payment order not found.');
      if (Number(snap.get('processingLeaseUntil') || 0) > Date.now()) return 'busy';
      tx.set(ref, { processingLeaseUntil: Date.now() + leaseMs, updatedAt: now() }, { merge: true });
      return 'acquired';
    });
  }

  async releaseOrder(id: string): Promise<void> {
    await this.orders.doc(id).set({ processingLeaseUntil: 0, updatedAt: now() }, { merge: true });
  }

  async ping(): Promise<void> {
    await this.orders.limit(1).get();
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
}

export const PAYMENT_LEASE_MS = 120_000;
export const EXTERNAL_TIMEOUT_MS = 15_000;
export const RESEND_IDEMPOTENCY_WINDOW_MS = 23 * 60 * 60 * 1000;

export function createPaymentStore(): PaymentStore {
  if (process.env.NODE_ENV === 'test') return new MemoryPaymentStore();
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  if (!projectId) throw new Error('GOOGLE_CLOUD_PROJECT is required for durable payment storage.');
  return new FirestorePaymentStore(projectId);
}

export function needsManualReconciliation(order: PaymentOrder): boolean {
  return order.checkoutStatus === 'unknown'
    || order.fulfillmentStatus === 'license_creation_unknown'
    || order.fulfillmentStatus === 'email_delivery_unknown';
}

export function clientOrderStatus(order: PaymentOrder) {
  return {
    status: order.status === 'creating' ? 'pending' : order.status,
    emailSent: order.fulfillmentStatus === 'email_sent',
    needsSupport: needsManualReconciliation(order)
  };
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

export function safeEventId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 && !value.includes('/');
}

export function safeCustomerName(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 160) : '';
}

export function safeCustomerEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 320 && /^\S+@\S+\.\S+$/.test(value.trim());
}
