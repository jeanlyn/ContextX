import { describe, it, expect } from 'vitest';
import { Message, Context } from '../../src/core/models';
import { OpenAIAdapter } from '../../src/adapters/openai';

describe('OpenAIAdapter', () => {
  it('converts basic messages', () => {
    const ctx = new Context([
      new Message('system', 'You are helpful'),
      new Message('user', 'Hello'),
      new Message('assistant', 'Hi!'),
    ]);
    const result = OpenAIAdapter.toMessages(ctx);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ role: 'system', content: 'You are helpful' });
    expect(result[1]).toEqual({ role: 'user', content: 'Hello' });
    expect(result[2]).toEqual({ role: 'assistant', content: 'Hi!' });
  });

  it('includes name', () => {
    const ctx = new Context([new Message('user', 'Hello', { name: 'alice' })]);
    const result = OpenAIAdapter.toMessages(ctx);
    expect(result[0]).toEqual({ role: 'user', content: 'Hello', name: 'alice' });
  });

  it('includes tool calls', () => {
    const ctx = new Context([new Message('assistant', '', { toolCalls: [{ id: 'call-1', type: 'function', function: { name: 'get_weather' } }] })]);
    const result = OpenAIAdapter.toMessages(ctx);
    expect(result[0].tool_calls).toEqual([{ id: 'call-1', type: 'function', function: { name: 'get_weather' } }]);
  });

  it('includes tool response', () => {
    const ctx = new Context([new Message('tool', 'sunny', { toolCallId: 'call-1' })]);
    const result = OpenAIAdapter.toMessages(ctx);
    expect(result[0]).toEqual({ role: 'tool', content: 'sunny', tool_call_id: 'call-1' });
  });

  it('handles empty context', () => {
    const ctx = new Context([]);
    const result = OpenAIAdapter.toMessages(ctx);
    expect(result).toEqual([]);
  });
});
