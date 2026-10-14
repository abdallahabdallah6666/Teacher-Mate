import { pgTable, serial, text, integer, timestamp, uuid, jsonb, bigint } from 'drizzle-orm/pg-core';

// Users table with uid as unique Firebase Auth identifier
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  role: text('role').default('user'),
  wilaya: text('wilaya'),
  primaryGrade: text('primary_grade').default('4AP'),
  licenseKey: text('license_key'),
  licenseStatus: text('license_status').default('trial'),
  licensePlan: text('license_plan').default('pro'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Teacher licenses table
export const licenses = pgTable('licenses', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  userEmail: text('user_email').notNull(),
  userName: text('user_name'),
  plan: text('plan').notNull().default('pro'),
  status: text('status').notNull().default('active'),
  issuedAt: text('issued_at'),
  expiresAt: text('expires_at'),
  paidVia: text('paid_via').default('Chargily Pay v2 (Edahabia/CIB)'),
  amountDZD: integer('amount_dzd').default(2900),
  maxDevices: integer('max_devices').default(3),
  createdAt: timestamp('created_at').defaultNow(),
});

// Chargily Pay Orders
export const chargilyOrders = pgTable('chargily_orders', {
  id: serial('id').primaryKey(),
  orderId: text('order_id').notNull().unique(),
  checkoutId: text('checkout_id'),
  planId: text('plan_id'),
  userEmail: text('user_email'),
  userName: text('user_name'),
  amount: integer('amount'),
  licenseKey: text('license_key'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Teacher Support Inquiries
export const inquiries = pgTable('inquiries', {
  id: serial('id').primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  wilaya: text('wilaya'),
  subject: text('subject'),
  message: text('message').notNull(),
  response: text('response'),
  status: text('status').default('open'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Teacher Mate Payment Orders (for durable checkout and fulfillment)
export const paymentOrders = pgTable('teacher_mate_payment_orders', {
  orderId: uuid('order_id').primaryKey(),
  checkoutId: text('checkout_id').unique(),
  orderData: jsonb('order_data').notNull(),
  processingLeaseUntil: bigint('processing_lease_until', { mode: 'number' }).notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Teacher Mate Chargily Webhook Events (for idempotency and distributed locking)
export const paymentEvents = pgTable('teacher_mate_chargily_events', {
  eventId: text('event_id').primaryKey(),
  eventType: text('event_type').notNull(),
  status: text('status').notNull(),
  leaseUntil: bigint('lease_until', { mode: 'number' }).notNull().default(0),
  attempts: integer('attempts').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Pricing Settings table for persisting plan pricing and details across app restarts
export const pricingSettingsTable = pgTable('pricing_settings', {
  id: text('id').primaryKey().default('current'),
  currencyDZD: text('currency_dzd').default('دج / DZD'),
  promoNoticeAr: text('promo_notice_ar'),
  promoNoticeFr: text('promo_notice_fr'),
  promoNoticeEn: text('promo_notice_en'),
  plans: jsonb('plans').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Promo Codes
export const promoCodes = pgTable('promo_codes', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  discountPercent: integer('discount_percent').notNull(),
  isActive: integer('is_active').default(1),
  maxUses: integer('max_uses'),
  uses: integer('uses').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});


