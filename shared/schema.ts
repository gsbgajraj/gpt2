import { z } from "zod";

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  picture: z.string().optional(),
  googleId: z.string(),
  createdAt: z.date()
});

// Conversation schema
export const conversationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  createdAt: z.date()
});

// Message schema
export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.date()
});

// Insert schemas
export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });
export const insertConversationSchema = conversationSchema.omit({ id: true, createdAt: true });
export const insertMessageSchema = messageSchema.omit({ id: true, timestamp: true });

// Types
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type InsertConversion = z.infer<typeof insertConversationSchema>;
export type Message = z.infer<typeof messageSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Chat input validation
export const chatSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional()
});

// Access code validation
export const accessCodeSchema = z.object({
  code: z.string()
});