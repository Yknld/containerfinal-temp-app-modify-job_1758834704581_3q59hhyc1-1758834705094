import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatSession, Message } from '../types';

const STORAGE_KEYS = {
  CHAT_SESSIONS: 'chat_sessions',
  CURRENT_SESSION: 'current_session',
};

export class StorageService {
  static async saveChatSessions(sessions: ChatSession[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving chat sessions:', error);
    }
  }

  static async getChatSessions(): Promise<ChatSession[]> {
    try {
      const sessionsJson = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
      return sessionsJson ? JSON.parse(sessionsJson) : [];
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      return [];
    }
  }

  static async saveCurrentSession(sessionId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, sessionId);
    } catch (error) {
      console.error('Error saving current session:', error);
    }
  }

  static async getCurrentSession(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    } catch (error) {
      console.error('Error loading current session:', error);
      return null;
    }
  }

  static async createNewSession(): Promise<ChatSession> {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const sessions = await this.getChatSessions();
    sessions.unshift(newSession);
    await this.saveChatSessions(sessions);
    await this.saveCurrentSession(newSession.id);

    return newSession;
  }

  static async updateSession(sessionId: string, messages: Message[]): Promise<void> {
    try {
      const sessions = await this.getChatSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex !== -1) {
        const session = sessions[sessionIndex];
        if (session) {
          session.messages = messages;
          session.updatedAt = Date.now();
          
          // Update title based on first message
          if (messages.length > 0 && session.title === 'New Chat') {
            const firstUserMessage = messages.find(m => m.type === 'user');
            if (firstUserMessage) {
              session.title = firstUserMessage.content.substring(0, 30) + '...';
            }
          }
          
          await this.saveChatSessions(sessions);
        }
      }
    } catch (error) {
      console.error('Error updating session:', error);
    }
  }

  static async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessions = await this.getChatSessions();
      const filteredSessions = sessions.filter(s => s.id !== sessionId);
      await this.saveChatSessions(filteredSessions);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }
}