import { db } from './index.ts';
import { chargilyOrders } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrderByOrderId(orderId: string) {
  try {
    const res = await db.select().from(chargilyOrders).where(eq(chargilyOrders.orderId, orderId)).limit(1);
    return res[0] || null;
  } catch (error) {
    console.error("Database query getOrderByOrderId failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function insertOrder(orderData: typeof chargilyOrders.$inferInsert) {
  try {
    const res = await db.insert(chargilyOrders).values(orderData).returning();
    return res[0];
  } catch (error) {
    console.error("Database query insertOrder failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const res = await db.update(chargilyOrders).set({ status }).where(eq(chargilyOrders.orderId, orderId)).returning();
    return res[0];
  } catch (error) {
    console.error("Database query updateOrderStatus failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
