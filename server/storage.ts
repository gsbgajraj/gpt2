import { User, Conversation, Message } from './db';
import type { 
  User as UserType,
  InsertUser,
  Conversation as ConversationType,
  InsertConversion,
  Message as MessageType,
  InsertMessage 
} from '@shared/schema';

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<UserType>;
  getUserByGoogleId(googleId: string): Promise<UserType | null>;
  getUserById(userId: string): Promise<UserType | null>;

  // Conversation operations
  getConversations(userId: string): Promise<ConversationType[]>;
  createConversation(conversation: InsertConversion): Promise<ConversationType>;

  // Message operations
  getMessages(conversationId: string): Promise<MessageType[]>;
  createMessage(message: InsertMessage): Promise<MessageType>;
}

export class MongoStorage implements IStorage {
  // User operations
  async createUser(insertUser: InsertUser): Promise<UserType> {
    const user = await User.create(insertUser);
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      picture: user.picture || "",
      googleId: user.googleId,
      createdAt: user.createdAt
    };
  }

  async getUserByGoogleId(googleId: string): Promise<UserType | null> {
    const user = await User.findOne({ googleId });
    if (!user) return null;

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      picture: user.picture || "",
      googleId: user.googleId,
      createdAt: user.createdAt
    };
  }

  async getUserById(userId: string): Promise<UserType | null> {
    const user = await User.findById(userId);
    if (!user) return null;

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      picture: user.picture || "",
      googleId: user.googleId,
      createdAt: user.createdAt
    };
  }

  // Conversation operations
  async getConversations(userId: string): Promise<ConversationType[]> {
    const conversations = await Conversation.find({ userId }).sort({ createdAt: -1 });
    return conversations.map(conv => ({
      id: conv._id.toString(),
      userId: conv.userId.toString(),
      title: conv.title,
      createdAt: conv.createdAt
    }));
  }

  async createConversation(insertConversation: InsertConversion): Promise<ConversationType> {
    const conversation = await Conversation.create(insertConversation);
    return {
      id: conversation._id.toString(),
      userId: conversation.userId.toString(),
      title: conversation.title,
      createdAt: conversation.createdAt
    };
  }

  // Message operations
  async getMessages(conversationId: string): Promise<MessageType[]> {
    const messages = await Message.find({ conversationId }).sort({ timestamp: 1 });
    return messages.map(msg => ({
      id: msg._id.toString(),
      conversationId: msg.conversationId.toString(),
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    }));
  }

  async createMessage(insertMessage: InsertMessage): Promise<MessageType> {
    const message = await Message.create(insertMessage);
    return {
      id: message._id.toString(),
      conversationId: message.conversationId.toString(),
      role: message.role,
      content: message.content,
      timestamp: message.timestamp
    };
  }
}

export const storage = new MongoStorage();