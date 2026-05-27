import { describe, it, expect } from 'vitest';
import {
  AgentContextError, StorageError, ThreadNotFoundError,
  StorageConnectionError, ValidationError, AssemblyError,
  ThreadEmptyError, TokenLimitExceededError, AdapterError,
} from '../src/exceptions';

describe('exception hierarchy', () => {
  it('has correct inheritance', () => {
    expect(new StorageError('x')).toBeInstanceOf(AgentContextError);
    expect(new ThreadNotFoundError('x')).toBeInstanceOf(StorageError);
    expect(new StorageConnectionError('x')).toBeInstanceOf(StorageError);
    expect(new ValidationError('x')).toBeInstanceOf(AgentContextError);
    expect(new AssemblyError('x')).toBeInstanceOf(AgentContextError);
    expect(new ThreadEmptyError('x')).toBeInstanceOf(AssemblyError);
    expect(new TokenLimitExceededError('x')).toBeInstanceOf(AssemblyError);
    expect(new AdapterError('x')).toBeInstanceOf(AgentContextError);
  });

  it('ThreadNotFoundError includes threadId', () => {
    const err = new ThreadNotFoundError('thread-123');
    expect(err.message).toContain('thread-123');
    expect(err.threadId).toBe('thread-123');
  });

  it('ThreadEmptyError includes threadId', () => {
    const err = new ThreadEmptyError('thread-456');
    expect(err.message).toContain('thread-456');
    expect(err.threadId).toBe('thread-456');
  });
});
