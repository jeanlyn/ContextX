import { describe, it, expect, beforeEach } from 'vitest';
import { ContextBuilder } from '../../src/assembly/builder';
import { InMemoryStorage } from '../../src/core/storage';
import { Message } from '../../src/core/models';
import { SlidingWindow, TokenBudget } from '../../src/management/window';
import { ThreadNotFoundError, AssemblyError } from '../../src/exceptions';

describe('ContextBuilder', () => {
  let storage: InMemoryStorage;
  let builder: ContextBuilder;

  beforeEach(() => {
    storage = new InMemoryStorage();
    builder = new ContextBuilder(storage);
  });

  it('builds basic context', async () => {
    const thread = await storage.createThread();
    await storage.saveMessage(thread.id, new Message('user', 'Hello'));
    const ctx = await builder.forThread(thread.id).build();
    expect(ctx.messages).toHaveLength(1);
    expect(ctx.messages[0].content).toBe('Hello');
  });

  it('injects system prompt', async () => {
    const thread = await storage.createThread();
    await storage.saveMessage(thread.id, new Message('user', 'Hello'));
    const ctx = await builder.forThread(thread.id).withSystemPrompt('You are helpful').build();
    expect(ctx.messages).toHaveLength(2);
    expect(ctx.messages[0].role).toBe('system');
    expect(ctx.messages[0].content).toBe('You are helpful');
  });

  it('applies sliding window', async () => {
    const thread = await storage.createThread();
    for (let i = 0; i < 5; i++) {
      await storage.saveMessage(thread.id, new Message('user', `msg-${i}`));
    }
    const ctx = await builder.forThread(thread.id).withWindowStrategy(new SlidingWindow(2)).build();
    expect(ctx.messages).toHaveLength(2);
    expect(ctx.messages[0].content).toBe('msg-3');
    expect(ctx.messages[1].content).toBe('msg-4');
  });

  it('applies token budget', async () => {
    const thread = await storage.createThread();
    for (let i = 0; i < 3; i++) {
      await storage.saveMessage(thread.id, new Message('user', 'a'.repeat(40)));
    }
    const ctx = await builder.forThread(thread.id).withWindowStrategy(new TokenBudget(20)).build();
    expect(ctx.messages).toHaveLength(2);
  });

  it('preserves system when injecting new one', async () => {
    const thread = await storage.createThread();
    await storage.saveMessage(thread.id, new Message('system', 'Original'));
    await storage.saveMessage(thread.id, new Message('user', 'Hello'));
    const ctx = await builder.forThread(thread.id).withSystemPrompt('New system').build();
    const systemMsgs = ctx.messages.filter(m => m.role === 'system');
    expect(systemMsgs).toHaveLength(1);
    expect(systemMsgs[0].content).toBe('New system');
  });

  it('can disable system preservation', async () => {
    const thread = await storage.createThread();
    await storage.saveMessage(thread.id, new Message('system', 'Original'));
    await storage.saveMessage(thread.id, new Message('user', 'Hello'));
    const ctx = await builder.forThread(thread.id).withSystemPrompt('New').preserveSystem(false).build();
    const systemMsgs = ctx.messages.filter(m => m.role === 'system');
    expect(systemMsgs).toHaveLength(1);
    expect(systemMsgs[0].content).toBe('New');
  });

  it('pins recent messages', async () => {
    const thread = await storage.createThread();
    for (let i = 0; i < 5; i++) {
      await storage.saveMessage(thread.id, new Message('user', `msg-${i}`));
    }
    const ctx = await builder.forThread(thread.id).withWindowStrategy(new SlidingWindow(2)).withRecentMessages(4).build();
    expect(ctx.messages).toHaveLength(4);
    expect(ctx.messages[0].content).toBe('msg-1');
  });

  it('includes metadata', async () => {
    const thread = await storage.createThread();
    for (let i = 0; i < 5; i++) {
      await storage.saveMessage(thread.id, new Message('user', `msg-${i}`));
    }
    const ctx = await builder.forThread(thread.id).withWindowStrategy(new SlidingWindow(2)).build();
    expect(ctx.metadata.totalMessages).toBe(5);
    expect(ctx.metadata.selectedMessages).toBe(2);
    expect(ctx.metadata.droppedMessages).toBe(3);
    expect(ctx.metadata.windowStrategy).toBe('SlidingWindow');
    expect(ctx.metadata.systemPromptInjected).toBe(false);
    expect(ctx.metadata.tokenEstimate).toBeDefined();
  });

  it('throws for nonexistent thread', async () => {
    await expect(builder.forThread('nonexistent').build()).rejects.toThrow(ThreadNotFoundError);
  });

  it('throws when thread not set', async () => {
    await expect(builder.build()).rejects.toThrow(AssemblyError);
  });

  it('supports fluent chaining', async () => {
    const b1 = builder.forThread('t1');
    const b2 = b1.withSystemPrompt('test');
    expect(b1).toBe(b2);
  });
});
