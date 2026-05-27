import { describe, it, expect } from 'vitest';
import { Message, Context } from '../../src/core/models';
import { AnthropicAdapter } from '../../src/adapters/anthropic';

describe('AnthropicAdapter', () => {
  it('extracts system prompt', () => {
    const ctx = new Context([
      new Message('system', 'You are helpful'),
      new Message('user', 'Hello'),
      new Message('assistant', 'Hi!'),
    ]);
    const [messages, system] = AnthropicAdapter.toMessages(ctx);
    expect(system).toBe('You are helpful');
    expect(messages).toHaveLength(2);
    expect(messages[0]).toEqual({ role: 'user', content: 'Hello' });
    expect(messages[1]).toEqual({ role: 'assistant', content: 'Hi!' });
  });

  it('returns null system when none', () => {
    const ctx = new Context([new Message('user', 'Hello')]);
    const [messages, system] = AnthropicAdapter.toMessages(ctx);
    expect(system).toBeNull();
    expect(messages).toHaveLength(1);
  });

  it('concatenates multiple system', () => {
    const ctx = new Context([
      new Message('system', 'First'),
      new Message('system', 'Second'),
      new Message('user', 'Hello'),
    ]);
    const [messages, system] = AnthropicAdapter.toMessages(ctx);
    expect(system).toBe('First\n\nSecond');
    expect(messages).toHaveLength(1);
  });

  it('handles empty context', () => {
    const ctx = new Context([]);
    const [messages, system] = AnthropicAdapter.toMessages(ctx);
    expect(messages).toEqual([]);
    expect(system).toBeNull();
  });
});
