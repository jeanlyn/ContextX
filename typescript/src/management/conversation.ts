import { Storage } from '../core/storage.js';
import { Thread, Message, MessageOptions } from '../core/models.js';
import { ThreadNotFoundError } from '../exceptions.js';

export class ConversationManager {
  constructor(private storage: Storage) {}

  async createThread(metadata?: Record<string, unknown>): Promise<Thread> {
    return this.storage.createThread(metadata);
  }

  async addMessage(
    threadId: string,
    role: string,
    content: string,
    options?: MessageOptions,
  ): Promise<Message> {
    const message = new Message(role, content, options);
    await this.storage.saveMessage(threadId, message);
    return message;
  }

  async getThread(threadId: string): Promise<Thread | null> {
    return this.storage.getThread(threadId);
  }

  async deleteThread(threadId: string): Promise<void> {
    await this.storage.deleteThread(threadId);
  }

  async listMessages(threadId: string): Promise<Message[]> {
    const thread = await this.storage.getThread(threadId);
    if (!thread) {
      throw new ThreadNotFoundError(threadId);
    }
    return thread.messages;
  }
}
