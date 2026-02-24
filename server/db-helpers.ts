import { eq, and, desc, gte } from "drizzle-orm";
import { apiKeys, chats, messages, usageStats, users } from "../drizzle/schema";
import { getDb } from "./db";
import type { InsertApiKey, InsertChat, InsertMessage, InsertUsageStat } from "../drizzle/schema";

/**
 * API Key Management
 */

export async function saveApiKey(
  userId: number,
  encryptedKey: string,
  provider: string = "openai"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(apiKeys).values({
    userId,
    encryptedKey,
    provider,
  });
}

export async function getApiKeyByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateApiKeyLastUsed(apiKeyId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKeyId));
}

/**
 * Chat Management
 */

export async function createChat(
  userId: number,
  title: string = "New Chat",
  description?: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(chats).values({
    userId,
    title,
    description,
  });

  // Get the created chat ID by querying the latest chat for this user
  const created = await db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.createdAt))
    .limit(1);

  return created[0]?.id || 0;
}

export async function getChatsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.createdAt));
}

export async function getChatById(chatId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateChatTitle(
  chatId: number,
  userId: number,
  title: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(chats)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
}

export async function deleteChat(chatId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete all messages in the chat first
  await db.delete(messages).where(eq(messages.chatId, chatId));

  // Then delete the chat
  await db
    .delete(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
}

/**
 * Message Management
 */

export async function saveMessage(
  chatId: number,
  userId: number,
  role: "user" | "assistant",
  content: string,
  tokensUsed: number = 0
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(messages).values({
    chatId,
    userId,
    role,
    content,
    tokensUsed,
  });

  // Get the created message ID by querying the latest message for this chat
  const created = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(desc(messages.createdAt))
    .limit(1);

  return created[0]?.id || 0;
}

export async function getMessagesByChatId(chatId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(messages)
    .where(and(eq(messages.chatId, chatId), eq(messages.userId, userId)))
    .orderBy(messages.createdAt);
}

/**
 * Usage Stats Management
 */

export async function getOrCreateUsageStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(usageStats)
    .where(eq(usageStats.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new usage stats
  await db.insert(usageStats).values({
    userId,
    dailyRequestCount: 0,
    monthlyRequestCount: 0,
    totalTokensUsed: 0,
  });

  const result = await db
    .select()
    .from(usageStats)
    .where(eq(usageStats.userId, userId))
    .limit(1);

  return result[0];
}

export async function incrementDailyRequestCount(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const stats = await getOrCreateUsageStats(userId);
  
  // Check if we need to reset daily counter (new day)
  const now = new Date();
  const lastReset = new Date(stats.lastDailyReset);
  const isNewDay = now.toDateString() !== lastReset.toDateString();

  if (isNewDay) {
    // Reset daily counter
    await db
      .update(usageStats)
      .set({
        dailyRequestCount: 1,
        lastDailyReset: now,
        updatedAt: now,
      })
      .where(eq(usageStats.userId, userId));
  } else {
    // Increment daily counter
    await db
      .update(usageStats)
      .set({
        dailyRequestCount: stats.dailyRequestCount + 1,
        updatedAt: now,
      })
      .where(eq(usageStats.userId, userId));
  }
}

export async function incrementMonthlyRequestCount(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const stats = await getOrCreateUsageStats(userId);
  
  // Check if we need to reset monthly counter (new month)
  const now = new Date();
  const lastReset = new Date(stats.lastMonthlyReset);
  const isNewMonth =
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear();

  if (isNewMonth) {
    // Reset monthly counter
    await db
      .update(usageStats)
      .set({
        monthlyRequestCount: 1,
        lastMonthlyReset: now,
        updatedAt: now,
      })
      .where(eq(usageStats.userId, userId));
  } else {
    // Increment monthly counter
    await db
      .update(usageStats)
      .set({
        monthlyRequestCount: stats.monthlyRequestCount + 1,
        updatedAt: now,
      })
      .where(eq(usageStats.userId, userId));
  }
}

export async function addTokensUsed(userId: number, tokens: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const stats = await getOrCreateUsageStats(userId);

  await db
    .update(usageStats)
    .set({
      totalTokensUsed: stats.totalTokensUsed + tokens,
      updatedAt: new Date(),
    })
    .where(eq(usageStats.userId, userId));
}

export async function checkRateLimit(
  userId: number,
  dailyLimit: number = 100,
  monthlyLimit: number = 3000
): Promise<{ allowed: boolean; reason?: string }> {
  const stats = await getOrCreateUsageStats(userId);

  if (stats.dailyRequestCount >= dailyLimit) {
    return {
      allowed: false,
      reason: `Daily limit of ${dailyLimit} requests exceeded`,
    };
  }

  if (stats.monthlyRequestCount >= monthlyLimit) {
    return {
      allowed: false,
      reason: `Monthly limit of ${monthlyLimit} requests exceeded`,
    };
  }

  return { allowed: true };
}
