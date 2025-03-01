import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chatSchema } from "@shared/schema";
import { authenticateToken, verifyGoogleToken, generateToken, type AuthenticatedRequest } from "./auth";
import axios from "axios";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Get authenticated user
  app.get("/api/user", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

  // Google authentication endpoint
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { token } = req.body;
      const payload = await verifyGoogleToken(token);

      if (!payload.email) throw new Error('Email required');

      // Find or create user
      let user = await storage.getUserByGoogleId(payload.sub!);
      if (!user) {
        user = await storage.createUser({
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          picture: payload.picture,
          googleId: payload.sub!
        });

        // Create default chat for new users
        await storage.createConversation({
          userId: user.id,
          title: "Welcome Chat"
        });
      }

      // Generate JWT
      const jwtToken = generateToken(user.id);
      res.json({ token: jwtToken, user });
    } catch (error) {
      console.error('Google auth error:', error);
      res.status(401).json({ error: 'Authentication failed' });
    }
  });

  // Get user's conversations
  app.get("/api/conversations", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const conversations = await storage.getConversations(req.userId!);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const conversation = await storage.createConversation({
        userId: req.userId!,
        title: "New Chat"
      });
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Get messages for a conversation
  app.get("/api/messages/:conversationId", authenticateToken, async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send message
  app.post("/api/chat", async (req, res) => { // Removed authenticateToken
    try {
      const { message, conversationId } = chatSchema.parse(req.body);

      // Create new conversation if not provided
      const actualConversationId = conversationId || (await storage.createConversation({
        userId: req.body.userId, // Assuming userId is now sent in the request body
        title: message.slice(0, 30) + "..."
      })).id;

      // Store user message
      await storage.createMessage({
        conversationId: actualConversationId,
        role: "user",
        content: message
      });

      // Call Azure OpenAI API
      const response = await axios.post(
        `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.DEPLOYMENT}/chat/completions?api-version=${process.env.API_VERSION}`,
        {
          messages: [{ role: "user", content: message }]
        },
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": process.env.AZURE_OPENAI_API_KEY
          }
        }
      );

      const assistantMessage = response.data.choices[0].message.content;

      // Store assistant response
      const storedMessage = await storage.createMessage({
        conversationId: actualConversationId,
        role: "assistant",
        content: assistantMessage
      });

      res.json(storedMessage);
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  return httpServer;
}