import { db } from './index.ts';
import { licenses } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getLicenses() {
  try {
    return await db.select().from(licenses);
  } catch (error) {
    console.error("Database query getLicenses failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function getLicenseByKey(key: string) {
  try {
    const res = await db.select().from(licenses).where(eq(licenses.key, key)).limit(1);
    return res[0] || null;
  } catch (error) {
    console.error("Database query getLicenseByKey failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function insertLicense(licenseData: typeof licenses.$inferInsert) {
  try {
    const res = await db.insert(licenses).values(licenseData).onConflictDoNothing().returning();
    return res[0];
  } catch (error) {
    console.error("Database query insertLicense failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function updateLicenseStatus(key: string, status: string) {
  try {
    const res = await db.update(licenses).set({ status }).where(eq(licenses.key, key)).returning();
    return res[0];
  } catch (error) {
    console.error("Database query updateLicenseStatus failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
