import { describe, it, expect } from 'vitest';
import {
  InMemoryStorage, ConversationManager, ContextBuilder,
  SlidingWindow, TokenBudget, OpenAIAdapter, AnthropicAdapter,
} from '../src/index';

describe('end-to-end flows', () => {
  it('full flow with OpenAI adapter', async () => {
    const storage = new InMemoryStorage();
    const manager = new ConversationManager(storage);
    const thread = await manager.createThread();
    await manager.addMessage(thread.id, 'system', 'You are helpful');
    await manager.addMessage(thread.id, 'user', 'What is the weather?');
    await manager.addMessage(thread.id, 'assistant', 'It is sunny!');
    const builder = new ContextBuilder(storage);
    const ctx = await builder.forThread(thread.id).withWindowStrategy(new SlidingWindow(10)).build();
    const messages = OpenAIAdapter.toMessages(ctx);
    expect(messages).toHaveLength(3);
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
    expect(messages[2].role).toBe('assistant');
  });

  it('full flow with Anthropic adapter', async () => {
    const storage = new InMemoryStorage();
    const manager = new ConversationManager(storage);
    const thread = await manager.createThread();
    await manager.addMessage(thread.id, 'system', 'You are helpful');
    await manager.addMessage(thread.id, 'user', 'Hello');
    const builder = new ContextBuilder(storage);
    const ctx = await builder.forThread(thread.id).build();
    const [messages, system] = AnthropicAdapter.toMessages(ctx);
    expect(system).toBe('You are helpful');
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toBe('Hello');
  });

  it('full flow with token budget', async () => {
    const storage = new InMemoryStorage();
    const manager = new ConversationManager(storage);
    const thread = await manager.createThread();
    await manager.addMessage(thread.id, 'user', 'a'.repeat(40));
    await manager.addMessage(thread.id, 'user', 'b'.repeat(40));
    await manager.addMessage(thread.id, 'user', 'c'.repeat(40));
    const builder = new ContextBuilder(storage);
    const ctx = await builder.forThread(thread.id).withWindowStrategy(new TokenBudget(15)).build();
    expect(ctx.messages).toHaveLength(1);
    expect(ctx.messages[0].content).toBe('c'.repeat(40));
    expect(ctx.metadata.tokenEstimate).toBeDefined();
  });

  it('system prompt override', async () => {
    const storage = new InMemoryStorage();
    const manager = new ConversationManager(storage);
    const thread = await manager.createThread();
    await manager.addMessage(thread.id, 'system', 'Old prompt');
    await manager.addMessage(thread.id, 'user', 'Hello');
    const builder = new ContextBuilder(storage);
    const ctx = await builder.forThread(thread.id).withSystemPrompt('New prompt').build();
    const systemMsgs = ctx.messages.filter(m => m.role === 'system');
    expect(systemMsgs).toHaveLength(1);
    expect(systemMsgs[0].content).toBe('New prompt');
  });
});
