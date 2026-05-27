import { describe, it, expect } from 'vitest';
import { Message } from '../../src/core/models';
import { SlidingWindow, TokenBudget } from '../../src/management/window';

const fakeTokenizer = { count: (text: string): number => text.length };

describe('SlidingWindow', () => {
  it('keeps last N', () => {
    const messages = Array.from({ length: 10 }, (_, i) => new Message('user', `msg-${i}`));
    const result = new SlidingWindow(3).select(messages);
    expect(result).toHaveLength(3);
    expect(result[0].content).toBe('msg-7');
    expect(result[1].content).toBe('msg-8');
    expect(result[2].content).toBe('msg-9');
  });

  it('handles fewer than max', () => {
    const messages = [new Message('user', 'x'), new Message('user', 'y')];
    const result = new SlidingWindow(5).select(messages);
    expect(result).toHaveLength(2);
  });

  it('returns empty for max of 0', () => {
    const messages = [new Message('user', 'x'), new Message('user', 'y')];
    const result = new SlidingWindow(0).select(messages);
    expect(result).toHaveLength(0);
  });
});

describe('TokenBudget', () => {
  it('keeps within heuristic budget', () => {
    const messages = [new Message('user', 'a'.repeat(40))];
    const result = new TokenBudget(15).select(messages);
    expect(result).toHaveLength(1);
  });

  it('keeps most recent when limited', () => {
    const messages = [new Message('user', 'a'.repeat(40)), new Message('user', 'b'.repeat(40))];
    const result = new TokenBudget(15).select(messages);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('b'.repeat(40));
  });

  it('drops oldest first', () => {
    const messages = [new Message('user', 'a'.repeat(40)), new Message('user', 'b'.repeat(40)), new Message('user', 'c'.repeat(40))];
    const result = new TokenBudget(20).select(messages);
    expect(result).toHaveLength(2);
    expect(result[0].content).toBe('b'.repeat(40));
    expect(result[1].content).toBe('c'.repeat(40));
  });

  it('preserves system messages', () => {
    const messages = [new Message('system', 'a'.repeat(40)), new Message('user', 'b'.repeat(40)), new Message('user', 'c'.repeat(40))];
    const result = new TokenBudget(15).select(messages);
    expect(result).toHaveLength(2);
    expect(result[0].role).toBe('system');
    expect(result[1].content).toBe('c'.repeat(40));
  });

  it('uses custom tokenizer', () => {
    const messages = [new Message('user', 'abc')];
    const result = new TokenBudget(5, fakeTokenizer).select(messages);
    expect(result).toHaveLength(1);
  });

  it('returns empty for empty input', () => {
    const result = new TokenBudget(100).select([]);
    expect(result).toEqual([]);
  });

  it('returns empty when single exceeds budget', () => {
    const messages = [new Message('user', 'a'.repeat(100))];
    const result = new TokenBudget(10).select(messages);
    expect(result).toHaveLength(0);
  });
});
