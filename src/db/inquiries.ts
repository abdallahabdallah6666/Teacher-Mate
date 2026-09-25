import { db } from './index.ts';
import { inquiries } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getInquiries() {
  try {
    return await db.select().from(inquiries);
  } catch (error) {
    console.error("Database query getInquiries failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function insertInquiry(inquiryData: typeof inquiries.$inferInsert) {
  try {
    const res = await db.insert(inquiries).values(inquiryData).returning();
    return res[0];
  } catch (error) {
    console.error("Database query insertInquiry failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function updateInquiry(id: number, patch: Partial<typeof inquiries.$inferInsert>) {
  try {
    const res = await db.update(inquiries).set(patch).where(eq(inquiries.id, id)).returning();
    return res[0];
  } catch (error) {
    console.error("Database query updateInquiry failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function deleteInquiry(id: number) {
  try {
    await db.delete(inquiries).where(eq(inquiries.id, id));
    return true;
  } catch (error) {
    console.error("Database query deleteInquiry failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
