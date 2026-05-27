import { Storage } from '../core/storage.js';
import { Thread, Message, Context } from '../core/models.js';
import { ConversationManager } from '../management/conversation.js';
import { WindowStrategy } from '../management/window.js';
import { ThreadNotFoundError, AssemblyError } from '../exceptions.js';

export class ContextBuilder {
  private threadId?: string;
  private systemPrompt?: string;
  private windowStrategy?: WindowStrategy;
  private recentMessages?: number;
  private preserveSystemFlag = true;
  private manager: ConversationManager;

  constructor(storage: Storage, manager?: ConversationManager) {
    this.manager = manager ?? new ConversationManager(storage);
  }

  forThread(threadId: string): this {
    this.threadId = threadId;
    return this;
  }

  withSystemPrompt(prompt: string): this {
    this.systemPrompt = prompt;
    return this;
  }

  withWindowStrategy(strategy: WindowStrategy): this {
    this.windowStrategy = strategy;
    return this;
  }

  withRecentMessages(count: number): this {
    this.recentMessages = count;
    return this;
  }

  preserveSystem(flag: boolean): this {
    this.preserveSystemFlag = flag;
    return this;
  }

  async build(): Promise<Context> {
    if (!this.threadId) {
      throw new AssemblyError('Thread not set');
    }

    const thread = await this.manager.getThread(this.threadId);
    if (!thread) {
      throw new ThreadNotFoundError(this.threadId);
    }

    const totalMessages = thread.messages.length;
    let messages = [...thread.messages];

    // Apply window strategy
    if (this.windowStrategy) {
      messages = this.windowStrategy.select(messages);
    }

    // Pin recent messages: merge with existing selection, preserve original order
    if (this.recentMessages !== undefined) {
      const recent = thread.messages.slice(-this.recentMessages);
      const seen = new Set(messages);
      for (const msg of recent) {
        if (!seen.has(msg)) {
          messages.push(msg);
        }
      }
      // Sort by original order from thread
      const order = new Map(thread.messages.map((m, i) => [m, i]));
      messages.sort((a, b) => (order.get(a) ?? Infinity) - (order.get(b) ?? Infinity));
    }

    // Inject system prompt
    const systemPrompt = this.systemPrompt;
    const systemPromptInjected = systemPrompt !== undefined;
    if (systemPromptInjected) {
      messages = messages.filter(m => m.role !== 'system');
      messages.unshift(new Message('system', systemPrompt));
    }

    const selectedMessages = messages.length;
    const droppedMessages = totalMessages - selectedMessages + (systemPromptInjected ? 1 : 0);

    // Calculate token estimate
    const tokenEstimate = messages.reduce((sum, m) => sum + Math.max(1, Math.floor(m.content.length / 4)), 0);

    const metadata: Record<string, unknown> = {
      totalMessages,
      selectedMessages,
      droppedMessages,
      windowStrategy: this.windowStrategy?.constructor.name ?? null,
      systemPromptInjected,
      tokenEstimate,
    };

    return new Context(messages, { systemPrompt: this.systemPrompt, tokenCount: tokenEstimate, metadata });
  }
}
