/// <reference lib="dom" />
import { Thread, Message } from './models.js';
import { ThreadNotFoundError } from '../exceptions.js';

export interface Storage {
  createThread(metadata?: Record<string, unknown>): Promise<Thread>;
  getThread(id: string): Promise<Thread | null>;
  saveMessage(threadId: string, message: Message): Promise<void>;
  deleteThread(id: string): Promise<void>;
  listThreads(limit?: number, offset?: number): Promise<Thread[]>;
}

export class InMemoryStorage implements Storage {
  private threads = new Map<string, Thread>();

  async createThread(metadata?: Record<string, unknown>): Promise<Thread> {
    const id = crypto.randomUUID();
    const thread = new Thread(id, { metadata });
    this.threads.set(id, thread);
    return thread;
  }

  async getThread(id: string): Promise<Thread | null> {
    return this.threads.get(id) ?? null;
  }

  async saveMessage(threadId: string, message: Message): Promise<void> {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new ThreadNotFoundError(threadId);
    }
    thread.messages.push(message);
    thread.updatedAt = new Date();
  }

  async deleteThread(id: string): Promise<void> {
    if (!this.threads.has(id)) {
      throw new ThreadNotFoundError(id);
    }
    this.threads.delete(id);
  }

  async listThreads(limit?: number, offset?: number): Promise<Thread[]> {
    const all = Array.from(this.threads.values());
    const start = offset ?? 0;
    const end = limit !== undefined ? start + limit : undefined;
    return all.slice(start, end);
  }
}
