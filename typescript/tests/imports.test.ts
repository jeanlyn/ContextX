import { describe, it, expect } from 'vitest';
import * as ac from '../src/index';

describe('public API exports', () => {
  it('exports core classes', () => {
    expect(ac.Message).toBeDefined();
    expect(ac.Thread).toBeDefined();
    expect(ac.Context).toBeDefined();
    expect(ac.InMemoryStorage).toBeDefined();
  });

  it('exports management classes', () => {
    expect(ac.ConversationManager).toBeDefined();
    expect(ac.SlidingWindow).toBeDefined();
    expect(ac.TokenBudget).toBeDefined();
  });

  it('exports assembly classes', () => {
    expect(ac.ContextBuilder).toBeDefined();
  });

  it('exports adapters', () => {
    expect(ac.OpenAIAdapter).toBeDefined();
    expect(ac.AnthropicAdapter).toBeDefined();
  });

  it('exports exceptions', () => {
    expect(ac.AgentContextError).toBeDefined();
    expect(ac.ThreadNotFoundError).toBeDefined();
    expect(ac.StorageError).toBeDefined();
    expect(ac.ValidationError).toBeDefined();
    expect(ac.AssemblyError).toBeDefined();
    expect(ac.AdapterError).toBeDefined();
  });
});
