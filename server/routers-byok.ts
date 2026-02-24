import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { encryptApiKey, decryptApiKey } from "./crypto";
import {
  saveApiKey,
  getApiKeyByUserId,
  updateApiKeyLastUsed,
  createChat,
  getChatsByUserId,
  getChatById,
  updateChatTitle,
  deleteChat,
  saveMessage,
  getMessagesByChatId,
  checkRateLimit,
  incrementDailyRequestCount,
  incrementMonthlyRequestCount,
  addTokensUsed,
} from "./db-helpers";

/**
 * BYOK (Bring Your Own Key) Router
 * Handles API key management, chat operations, and AI interactions
 */
export const byokRouter = router({
  /**
   * Save or update user's API key
   * The key is encrypted before storage
   */
  apiKey: router({
    save: protectedProcedure
      .input(
        z.object({
          apiKey: z.string().min(1, "API key cannot be empty"),
          provider: z.string().default("openai"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Encrypt the API key
          const encryptedKey = encryptApiKey(input.apiKey);

          // Save to database
          await saveApiKey(ctx.user.id, encryptedKey, input.provider);

          return {
            success: true,
            message: "API key saved successfully",
          };
        } catch (error) {
          console.error("Failed to save API key:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to save API key",
          });
        }
      }),

    /**
     * Check if user has a saved API key
     */
    exists: protectedProcedure.query(async ({ ctx }) => {
      try {
        const apiKey = await getApiKeyByUserId(ctx.user.id);
        return {
          exists: !!apiKey,
          provider: apiKey?.provider || null,
        };
      } catch (error) {
        console.error("Failed to check API key:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check API key",
        });
      }
    }),
  }),

  /**
   * Chat management procedures
   */
  chat: router({
    /**
     * Create a new chat session
     */
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().default("New Chat"),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Check rate limit
          const rateLimitCheck = await checkRateLimit(ctx.user.id);
          if (!rateLimitCheck.allowed) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: rateLimitCheck.reason || "Rate limit exceeded",
            });
          }

          const chatId = await createChat(
            ctx.user.id,
            input.title,
            input.description
          );

          return {
            success: true,
            chatId,
            message: "Chat created successfully",
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Failed to create chat:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create chat",
          });
        }
      }),

    /**
     * Get all chats for the current user
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        const userChats = await getChatsByUserId(ctx.user.id);
        return {
          chats: userChats,
          count: userChats.length,
        };
      } catch (error) {
        console.error("Failed to fetch chats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch chats",
        });
      }
    }),

    /**
     * Get a specific chat with all its messages
     */
    get: protectedProcedure
      .input(z.object({ chatId: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          const chat = await getChatById(input.chatId, ctx.user.id);

          if (!chat) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Chat not found",
            });
          }

          const chatMessages = await getMessagesByChatId(
            input.chatId,
            ctx.user.id
          );

          return {
            chat,
            messages: chatMessages,
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Failed to fetch chat:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch chat",
          });
        }
      }),

    /**
     * Update chat title
     */
    updateTitle: protectedProcedure
      .input(
        z.object({
          chatId: z.number(),
          title: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const chat = await getChatById(input.chatId, ctx.user.id);

          if (!chat) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Chat not found",
            });
          }

          await updateChatTitle(input.chatId, ctx.user.id, input.title);

          return {
            success: true,
            message: "Chat title updated successfully",
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Failed to update chat title:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update chat title",
          });
        }
      }),

    /**
     * Delete a chat and all its messages
     */
    delete: protectedProcedure
      .input(z.object({ chatId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const chat = await getChatById(input.chatId, ctx.user.id);

          if (!chat) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Chat not found",
            });
          }

          await deleteChat(input.chatId, ctx.user.id);

          return {
            success: true,
            message: "Chat deleted successfully",
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Failed to delete chat:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete chat",
          });
        }
      }),
  }),

  /**
   * Message management and AI interaction
   */
  message: router({
    /**
     * Send a message and get AI response
     * This is the main procedure that uses the user's API key
     */
    send: protectedProcedure
      .input(
        z.object({
          chatId: z.number(),
          content: z.string().min(1, "Message cannot be empty"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Check rate limit
          const rateLimitCheck = await checkRateLimit(ctx.user.id);
          if (!rateLimitCheck.allowed) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: rateLimitCheck.reason || "Rate limit exceeded",
            });
          }

          // Verify chat exists and belongs to user
          const chat = await getChatById(input.chatId, ctx.user.id);
          if (!chat) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Chat not found",
            });
          }

          // Get user's API key
          const apiKeyRecord = await getApiKeyByUserId(ctx.user.id);
          if (!apiKeyRecord) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "API key not configured. Please set up your API key first.",
            });
          }

          // Decrypt the API key
          let decryptedKey: string;
          try {
            decryptedKey = decryptApiKey(apiKeyRecord.encryptedKey);
          } catch (error) {
            console.error("Failed to decrypt API key:", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to decrypt API key",
            });
          }

          // Save user message
          await saveMessage(input.chatId, ctx.user.id, "user", input.content);

          // TODO: Call actual AI API using decryptedKey
          // For now, return a placeholder response
          const aiResponse = `[AI Response] You said: "${input.content}"`;

          // Save AI response
          await saveMessage(input.chatId, ctx.user.id, "assistant", aiResponse);

          // Update usage stats
          await incrementDailyRequestCount(ctx.user.id);
          await incrementMonthlyRequestCount(ctx.user.id);
          await updateApiKeyLastUsed(apiKeyRecord.id);

          return {
            success: true,
            userMessage: input.content,
            aiResponse,
            message: "Message sent successfully",
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Failed to send message:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send message",
          });
        }
      }),

    /**
     * Get all messages in a chat
     */
    list: protectedProcedure
      .input(z.object({ chatId: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          const chatMessages = await getMessagesByChatId(
            input.chatId,
            ctx.user.id
          );

          return {
            messages: chatMessages,
            count: chatMessages.length,
          };
        } catch (error) {
          console.error("Failed to fetch messages:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch messages",
          });
        }
      }),
  }),
});
