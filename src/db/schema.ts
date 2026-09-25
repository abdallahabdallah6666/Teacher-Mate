import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

// Users table with uid as unique Firebase Auth identifier
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  fullName: text('full_name'),
  role: text('role').default('user'),
  wilaya: text('wilaya'),
  schoolName: text('school_name'),
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
