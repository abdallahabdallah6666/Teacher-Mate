import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export interface UpsertUserData {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  role?: string;
  wilaya?: string;
  schoolName?: string;
  primaryGrade?: string;
  licenseKey?: string;
  licenseStatus?: string;
  licensePlan?: string;
}

export async function getUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error("Database query getUsers failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function getAllUsers() {
  return getUsers();
}

export async function getOrCreateUser(uid: string, email: string, extraData: Partial<UpsertUserData> = {}) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        firstName: extraData.firstName,
        lastName: extraData.lastName,
        fullName: extraData.fullName || (extraData.firstName && extraData.lastName ? `${extraData.firstName} ${extraData.lastName}` : undefined),
        role: extraData.role || (email.toLowerCase().includes('admin') ? 'admin' : 'user'),
        wilaya: extraData.wilaya,
        schoolName: extraData.schoolName,
        primaryGrade: extraData.primaryGrade || '4AP',
        licenseKey: extraData.licenseKey,
        licenseStatus: extraData.licenseStatus || 'trial',
        licensePlan: extraData.licensePlan || 'pro',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(extraData.fullName ? { fullName: extraData.fullName } : {}),
          ...(extraData.role ? { role: extraData.role } : {}),
          ...(extraData.wilaya ? { wilaya: extraData.wilaya } : {}),
          ...(extraData.schoolName ? { schoolName: extraData.schoolName } : {}),
          ...(extraData.licenseKey ? { licenseKey: extraData.licenseKey } : {}),
          ...(extraData.licenseStatus ? { licenseStatus: extraData.licenseStatus } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database query getOrCreateUser failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Database query getUserByUid failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function getUserByEmail(email: string) {
  try {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Database query getUserByEmail failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function insertUser(userData: typeof users.$inferInsert) {
  try {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  } catch (error) {
    console.error("Database query insertUser failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function updateUserByEmail(email: string, patch: Partial<typeof users.$inferInsert>) {
  try {
    const result = await db.update(users).set(patch).where(eq(users.email, email)).returning();
    return result[0];
  } catch (error) {
    console.error("Database query updateUserByEmail failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
