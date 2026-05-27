import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStorage } from '../../src/core/storage';
import { Message } from '../../src/core/models';
import { ThreadNotFoundError } from '../../src/exceptions';

describe('InMemoryStorage', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  it('creates thread with uuid', async () => {
    const thread = await storage.createThread();
    expect(thread.id).toBeDefined();
    expect(typeof thread.id).toBe('string');
    expect(thread.messages).toEqual([]);
    expect(thread.metadata).toEqual({});
  });

  it('creates thread with metadata', async () => {
    const thread = await storage.createThread({ key: 'value' });
    expect(thread.metadata).toEqual({ key: 'value' });
  });

  it('saves and retrieves message', async () => {
    const thread = await storage.createThread();
    const msg = new Message('user', 'Hello');
    await storage.saveMessage(thread.id, msg);
    const retrieved = await storage.getThread(thread.id);
    expect(retrieved!.messages).toHaveLength(1);
    expect(retrieved!.messages[0].content).toBe('Hello');
    expect(retrieved!.updatedAt.getTime()).toBeGreaterThanOrEqual(retrieved!.createdAt.getTime());
  });

  it('returns null for nonexistent thread', async () => {
    const result = await storage.getThread('nonexistent');
    expect(result).toBeNull();
  });

  it('deletes thread', async () => {
    const thread = await storage.createThread();
    await storage.deleteThread(thread.id);
    expect(await storage.getThread(thread.id)).toBeNull();
  });

  it('throws on delete nonexistent', async () => {
    await expect(storage.deleteThread('nonexistent')).rejects.toThrow(ThreadNotFoundError);
  });

  it('throws on save to nonexistent', async () => {
    const msg = new Message('user', 'Hello');
    await expect(storage.saveMessage('nonexistent', msg)).rejects.toThrow(ThreadNotFoundError);
  });

  it('lists threads', async () => {
    const t1 = await storage.createThread();
    const t2 = await storage.createThread();
    const threads = await storage.listThreads();
    expect(threads).toHaveLength(2);
  });

  it('paginates threads', async () => {
    for (let i = 0; i < 5; i++) {
      await storage.createThread();
    }
    const threads = await storage.listThreads(2, 1);
    expect(threads).toHaveLength(2);
  });
});
