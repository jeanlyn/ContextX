import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationManager } from '../../src/management/conversation';
import { InMemoryStorage } from '../../src/core/storage';
import { ThreadNotFoundError } from '../../src/exceptions';

describe('ConversationManager', () => {
  let manager: ConversationManager;

  beforeEach(() => {
    manager = new ConversationManager(new InMemoryStorage());
  });

  it('creates thread', async () => {
    const thread = await manager.createThread();
    expect(thread.id).toBeDefined();
    expect(thread.messages).toEqual([]);
  });

  it('creates thread with metadata', async () => {
    const thread = await manager.createThread({ key: 'value' });
    expect(thread.metadata).toEqual({ key: 'value' });
  });

  it('adds message', async () => {
    const thread = await manager.createThread();
    const msg = await manager.addMessage(thread.id, 'user', 'Hello');
    expect(msg.role).toBe('user');
    expect(msg.content).toBe('Hello');
    const retrieved = await manager.getThread(thread.id);
    expect(retrieved!.messages).toHaveLength(1);
  });

  it('adds message with options', async () => {
    const thread = await manager.createThread();
    const msg = await manager.addMessage(thread.id, 'assistant', '', { toolCalls: [{ id: 'call-1' }] });
    expect(msg.toolCalls).toEqual([{ id: 'call-1' }]);
  });

  it('gets thread', async () => {
    const thread = await manager.createThread();
    const retrieved = await manager.getThread(thread.id);
    expect(retrieved!.id).toBe(thread.id);
  });

  it('returns null for nonexistent', async () => {
    const result = await manager.getThread('nonexistent');
    expect(result).toBeNull();
  });

  it('deletes thread', async () => {
    const thread = await manager.createThread();
    await manager.deleteThread(thread.id);
    expect(await manager.getThread(thread.id)).toBeNull();
  });

  it('throws on delete nonexistent', async () => {
    await expect(manager.deleteThread('nonexistent')).rejects.toThrow(ThreadNotFoundError);
  });

  it('lists messages', async () => {
    const thread = await manager.createThread();
    await manager.addMessage(thread.id, 'user', 'Hello');
    await manager.addMessage(thread.id, 'assistant', 'Hi!');
    const messages = await manager.listMessages(thread.id);
    expect(messages).toHaveLength(2);
    expect(messages[0].content).toBe('Hello');
    expect(messages[1].content).toBe('Hi!');
  });

  it('throws on list messages for nonexistent', async () => {
    await expect(manager.listMessages('nonexistent')).rejects.toThrow(ThreadNotFoundError);
  });
});
