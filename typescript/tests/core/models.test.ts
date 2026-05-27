import { describe, it, expect } from 'vitest';
import { Message, Thread, Context } from '../../src/core/models';

describe('Message', () => {
  it('creates with defaults', () => {
    const msg = new Message('user', 'Hello');
    expect(msg.role).toBe('user');
    expect(msg.content).toBe('Hello');
    expect(msg.name).toBeUndefined();
    expect(msg.toolCalls).toBeUndefined();
    expect(msg.toolCallId).toBeUndefined();
    expect(msg.metadata).toBeUndefined();
    expect(msg.createdAt).toBeInstanceOf(Date);
  });

  it('creates with all fields', () => {
    const msg = new Message('assistant', '', {
      name: 'weather_tool',
      toolCalls: [{ id: 'call-1' }],
      toolCallId: 'call-1',
      metadata: { key: 'value' },
    });
    expect(msg.name).toBe('weather_tool');
    expect(msg.toolCalls).toEqual([{ id: 'call-1' }]);
    expect(msg.toolCallId).toBe('call-1');
    expect(msg.metadata).toEqual({ key: 'value' });
  });
});

describe('Thread', () => {
  it('creates with defaults', () => {
    const thread = new Thread('t-1');
    expect(thread.id).toBe('t-1');
    expect(thread.messages).toEqual([]);
    expect(thread.metadata).toEqual({});
    expect(thread.createdAt).toBeInstanceOf(Date);
    expect(thread.updatedAt).toBeInstanceOf(Date);
  });
});

describe('Context', () => {
  it('creates with required fields', () => {
    const msg = new Message('user', 'Hello');
    const ctx = new Context([msg]);
    expect(ctx.messages).toEqual([msg]);
    expect(ctx.systemPrompt).toBeUndefined();
    expect(ctx.tokenCount).toBeUndefined();
    expect(ctx.metadata).toEqual({});
  });

  it('creates with all fields', () => {
    const msg = new Message('system', 'Be helpful');
    const ctx = new Context([msg], {
      systemPrompt: 'Be helpful',
      tokenCount: 5,
      metadata: { source: 'test' },
    });
    expect(ctx.systemPrompt).toBe('Be helpful');
    expect(ctx.tokenCount).toBe(5);
    expect(ctx.metadata).toEqual({ source: 'test' });
  });
});
