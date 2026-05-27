# Agent Context SDK — TypeScript Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the TypeScript version of the agent-context SDK with conversation history, window management, context assembly, and OpenAI/Anthropic adapters.

**Architecture:** Four-layer package (`core` → `management` → `assembly` → `adapters`) with Promise-based storage abstraction, zero-dependency core, and pluggable window strategies.

**Tech Stack:** TypeScript 5.0+, Node 18+, Vitest, tsup (build)

---

## File Structure

```
typescript/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts               # Public API exports
│   ├── exceptions.ts          # Exception hierarchy
│   ├── core/
│   │   ├── index.ts
│   │   ├── models.ts          # Message, Thread, Context interfaces
│   │   └── storage.ts         # Storage interface + InMemoryStorage
│   ├── management/
│   │   ├── index.ts
│   │   ├── conversation.ts    # ConversationManager
│   │   └── window.ts          # WindowStrategy + implementations
│   ├── assembly/
│   │   ├── index.ts
│   │   └── builder.ts         # ContextBuilder
│   └── adapters/
│       ├── index.ts
│       ├── openai.ts          # OpenAIAdapter
│       └── anthropic.ts       # AnthropicAdapter
└── tests/
    ├── exceptions.test.ts
    ├── core/
    │   ├── models.test.ts
    │   └── storage.test.ts
    ├── management/
    │   ├── conversation.test.ts
    │   └── window.test.ts
    ├── assembly/
    │   └── builder.test.ts
    ├── adapters/
    │   ├── openai.test.ts
    │   └── anthropic.test.ts
    └── integration.test.ts
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `typescript/package.json`
- Create: `typescript/tsconfig.json`
- Create: `typescript/src/index.ts`
- Create: `typescript/src/exceptions.ts`
- Create: `typescript/src/core/index.ts`
- Create: `typescript/src/management/index.ts`
- Create: `typescript/src/assembly/index.ts`
- Create: `typescript/src/adapters/index.ts`

- [ ] **Step 1: Write package.json**

`typescript/package.json`:
```json
{
  "name": "agent-context",
  "version": "0.1.0",
  "description": "Agent context management SDK",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

- [ ] **Step 2: Write tsconfig.json**

`typescript/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create placeholder source files**

Run:
```bash
mkdir -p typescript/src/{core,management,assembly,adapters}
mkdir -p typescript/tests/{core,management,assembly,adapters}
touch typescript/src/index.ts
```

- [ ] **Step 4: Install dependencies**

Run:
```bash
cd typescript
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 5: Verify vitest works**

Run:
```bash
cd typescript
npx vitest run --version
```

Expected: Vitest version output.

- [ ] **Step 6: Commit**

```bash
git add typescript/
git commit -m "chore: scaffold TypeScript package structure

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Exception Hierarchy

**Files:**
- Create: `typescript/src/exceptions.ts`
- Create: `typescript/tests/exceptions.test.ts`

- [ ] **Step 1: Write the failing test**

`typescript/tests/exceptions.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  AgentContextError,
  StorageError,
  ThreadNotFoundError,
  StorageConnectionError,
  ValidationError,
  AssemblyError,
  ThreadEmptyError,
  TokenLimitExceededError,
  AdapterError,
} from '../src/exceptions';

describe('exception hierarchy', () => {
  it('has correct inheritance chain', () => {
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd typescript
npx vitest run tests/exceptions.test.ts
```

Expected: Import/parse errors for `../src/exceptions`.

- [ ] **Step 3: Write minimal implementation**

`typescript/src/exceptions.ts`:
```typescript
export class AgentContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class StorageError extends AgentContextError {}

export class ThreadNotFoundError extends StorageError {
  readonly threadId: string;

  constructor(threadId: string) {
    super(`Thread not found: ${threadId}`);
    this.threadId = threadId;
  }
}

export class StorageConnectionError extends StorageError {}

export class ValidationError extends AgentContextError {}

export class AssemblyError extends AgentContextError {}

export class ThreadEmptyError extends AssemblyError {
  readonly threadId: string;

  constructor(threadId: string) {
    super(`Thread has no messages: ${threadId}`);
    this.threadId = threadId;
  }
}

export class TokenLimitExceededError extends AssemblyError {}

export class AdapterError extends AgentContextError {}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd typescript
npx vitest run tests/exceptions.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add typescript/src/exceptions.ts typescript/tests/exceptions.test.ts
git commit -m "feat(ts): add exception hierarchy

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Core Data Models

**Files:**
- Create: `typescript/src/core/models.ts`
- Create: `typescript/tests/core/models.test.ts`

- [ ] **Step 1: Write the failing test**

`typescript/tests/core/models.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd typescript
npx vitest run tests/core/models.test.ts
```

Expected: Import/parse errors for `../../src/core/models`.

- [ ] **Step 3: Write minimal implementation**

`typescript/src/core/models.ts`:
```typescript
export interface MessageOptions {
  name?: string;
  toolCalls?: Record<string, unknown>[];
  toolCallId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

export class Message {
  role: string;
  content: string;
  name?: string;
  toolCalls?: Record<string, unknown>[];
  toolCallId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;

  constructor(role: string, content: string, options: MessageOptions = {}) {
    this.role = role;
    this.content = content;
    this.name = options.name;
    this.toolCalls = options.toolCalls;
    this.toolCallId = options.toolCallId;
    this.metadata = options.metadata;
    this.createdAt = options.createdAt ?? new Date();
  }
}

export interface ThreadOptions {
  messages?: Message[];
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Thread {
  id: string;
  messages: Message[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;

  constructor(id: string, options: ThreadOptions = {}) {
    this.id = id;
    this.messages = options.messages ?? [];
    this.metadata = options.metadata ?? {};
    this.createdAt = options.createdAt ?? new Date();
    this.updatedAt = options.updatedAt ?? new Date();
  }
}

export interface ContextOptions {
  systemPrompt?: string;
  tokenCount?: number;
  metadata?: Record<string, unknown>;
}

export class Context {
  messages: Message[];
  systemPrompt?: string;
  tokenCount?: number;
  metadata: Record<string, unknown>;

  constructor(messages: Message[], options: ContextOptions = {}) {
    this.messages = messages;
    this.systemPrompt = options.systemPrompt;
    this.tokenCount = options.tokenCount;
    this.metadata = options.metadata ?? {};
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd typescript
npx vitest run tests/core/models.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add typescript/src/core/models.ts typescript/tests/core/models.test.ts
git commit -m "feat(ts): add core data models (Message, Thread, Context)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Storage Interface + InMemoryStorage

**Files:**
- Create: `typescript/src/core/storage.ts`
- Create: `typescript/tests/core/storage.test.ts`

- [ ] **Step 1: Write the failing test**

`typescript/tests/core/storage.test.ts`:
```typescript
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

  it('throws on delete nonexistent thread', async () => {
    await expect(storage.deleteThread('nonexistent')).rejects.toThrow(ThreadNotFoundError);
  });

  it('throws on save to nonexistent thread', async () => {
    const msg = new Message('user', 'Hello');
    await expect(storage.saveMessage('nonexistent', msg)).rejects.toThrow(ThreadNotFoundError);
  });

  it('lists threads', async () => {
    const t1 = await storage.createThread();
    const t2 = await storage.createThread();
    const threads = await storage.listThreads();
    expect(threads).toHaveLength(2);
    const ids = threads.map(t => t.id);
    expect(ids).toContain(t1.id);
    expect(ids).toContain(t2.id);
  });

  it('paginates threads', async () => {
    for (let i = 0; i < 5; i++) {
      await storage.createThread();
    }
    const threads = await storage.listThreads(2, 1);
    expect(threads).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd typescript
npx vitest run tests/core/storage.test.ts
```

Expected: Import/parse errors for `../../src/core/storage`.

- [ ] **Step 3: Write minimal implementation**

`typescript/src/core/storage.ts`:
```typescript
import { Thread, Message } from './models';
import { ThreadNotFoundError } from '../exceptions';

export interface Storage {
  createThread(metadata?: Record<string, unknown>): Promise<Thread>;
  saveMessage(threadId: string, message: Message): Promise<void>;
  getThread(threadId: string): Promise<Thread | null>;
  deleteThread(threadId: string): Promise<void>;
  listThreads(limit?: number, offset?: number): Promise<Thread[]>;
}

export class InMemoryStorage implements Storage {
  private threads: Map<string, Thread> = new Map();

  async createThread(metadata?: Record<string, unknown>): Promise<Thread> {
    const id = crypto.randomUUID();
    const thread = new Thread(id, { metadata: metadata ?? {} });
    this.threads.set(id, thread);
    return thread;
  }

  async saveMessage(threadId: string, message: Message): Promise<void> {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new ThreadNotFoundError(threadId);
    }
    thread.messages.push(message);
    thread.updatedAt = new Date();
  }

  async getThread(threadId: string): Promise<Thread | null> {
    return this.threads.get(threadId) ?? null;
  }

  async deleteThread(threadId: string): Promise<void> {
    if (!this.threads.has(threadId)) {
      throw new ThreadNotFoundError(threadId);
    }
    this.threads.delete(threadId);
  }

  async listThreads(limit: number = 100, offset: number = 0): Promise<Thread[]> {
    const all = Array.from(this.threads.values());
    return all.slice(offset, offset + limit);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd typescript
npx vitest run tests/core/storage.test.ts
```

Expected: 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add typescript/src/core/storage.ts typescript/tests/core/storage.test.ts
git commit -m "feat(ts): add Storage interface and InMemoryStorage

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: WindowStrategy + Implementations

**Files:**
- Create: `typescript/src/management/window.ts`
- Create: `typescript/tests/management/window.test.ts`

- [ ] **Step 1: Write the failing test**

`typescript/tests/management/window.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { Message } from '../../src/core/models';
import { SlidingWindow, TokenBudget } from '../../src/management/window';

const fakeTokenizer = {
  count: (text: string): number => text.length,
};

describe('SlidingWindow', () => {
  it('keeps last N messages', () => {
    const messages = Array.from({ length: 10 }, (_, i) => new Message('user', `msg-${i}`));
    const strategy = new SlidingWindow(3);
    const result = strategy.select(messages);
    expect(result).toHaveLength(3);
    expect(result[0].content).toBe('msg-7');
    expect(result[1].content).toBe('msg-8');
    expect(result[2].content).toBe('msg-9');
  });

  it('handles fewer messages than max', () => {
    const messages = [new Message('user', 'x'), new Message('user', 'y')];
    const strategy = new SlidingWindow(5);
    const result = strategy.select(messages);
    expect(result).toHaveLength(2);
  });

  it('returns empty for max of 0', () => {
    const messages = [new Message('user', 'x'), new Message('user', 'y')];
    const strategy = new SlidingWindow(0);
    const result = strategy.select(messages);
    expect(result).toHaveLength(0);
  });
});

describe('TokenBudget', () => {
  it('keeps messages within heuristic budget', () => {
    const messages = [new Message('user', 'a'.repeat(40))]; // ~10 tokens
    const strategy = new TokenBudget(15);
    const result = strategy.select(messages);
    expect(result).toHaveLength(1);
  });

  it('keeps most recent when budget limited', () => {
    const messages = [
      new Message('user', 'a'.repeat(40)),
      new Message('user', 'b'.repeat(40)),
    ];
    const strategy = new TokenBudget(15);
    const result = strategy.select(messages);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('b'.repeat(40));
  });

  it('drops oldest first', () => {
    const messages = [
      new Message('user', 'a'.repeat(40)),
      new Message('user', 'b'.repeat(40)),
      new Message('user', 'c'.repeat(40)),
    ];
    const strategy = new TokenBudget(20);
    const result = strategy.select(messages);
    expect(result).toHaveLength(2);
    expect(result[0].content).toBe('b'.repeat(40));
    expect(result[1].content).toBe('c'.repeat(40));
  });

  it('preserves system messages', () => {
    const messages = [
      new Message('system', 'a'.repeat(40)),
      new Message('user', 'b'.repeat(40)),
      new Message('user', 'c'.repeat(40)),
    ];
    const strategy = new TokenBudget(15);
    const result = strategy.select(messages);
    expect(result).toHaveLength(2);
    expect(result[0].role).toBe('system');
    expect(result[1].content).toBe('c'.repeat(40));
  });

  it('uses custom tokenizer', () => {
    const messages = [new Message('user', 'abc')];
    const strategy = new TokenBudget(5, fakeTokenizer);
    const result = strategy.select(messages);
    expect(result).toHaveLength(1);
  });

  it('returns empty for empty input', () => {
    const strategy = new TokenBudget(100);
    const result = strategy.select([]);
    expect(result).toEqual([]);
  });

  it('returns empty when single message exceeds budget', () => {
    const messages = [new Message('user', 'a'.repeat(100))];
    const strategy = new TokenBudget(10);
    const result = strategy.select(messages);
    expect(result).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd typescript
npx vitest run tests/management/window.test.ts
```

Expected: Import/parse errors for `../../src/management/window`.

- [ ] **Step 3: Write minimal implementation**

`typescript/src/management/window.ts`:
```typescript
import { Message } from '../core/models';

export interface Tokenizer {
  count(text: string): number;
}

export interface WindowStrategy {
  select(messages: Message[]): Message[];
}

export class SlidingWindow implements WindowStrategy {
  constructor(private maxMessages: number) {}

  select(messages: Message[]): Message[] {
    return messages.slice(-this.maxMessages);
  }
}

export class TokenBudget implements WindowStrategy {
  constructor(
    private maxTokens: number,
    private tokenizer?: Tokenizer,
  ) {}

  private countTokens(text: string): number {
    if (this.tokenizer) {
      return this.tokenizer.count(text);
    }
    return Math.max(1, Math.floor(text.length / 4));
  }

  select(messages: Message[]): Message[] {
    const systemMessages = messages.filter(m => m.role === 'system');
    const nonSystem = messages.filter(m => m.role !== 'system');

    const selected: Message[] = [];
    let totalTokens = 0;

    for (const msg of [...nonSystem].reverse()) {
      const msgTokens = this.countTokens(msg.content);
      if (totalTokens + msgTokens <= this.maxTokens) {
        selected.unshift(msg);
        totalTokens += msgTokens;
      } else {
        break;
      }
    }

    return [...systemMessages, ...selected];
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd typescript
npx vitest run tests/management/window.test.ts
```

Expected: 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add typescript/src/management/window.ts typescript/tests/management/window.test.ts
git commit -m "feat(ts): add WindowStrategy, SlidingWindow, TokenBudget

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: ConversationManager

**Files:**
- Create: `typescript/src/management/conversation.ts`
- Create: `typescript/tests/management/conversation.test.ts`

- [ ] **Step 1: Write the failing test**

`typescript/tests/management/conversation.test.ts`:
```typescript
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
    const msg = await manager.addMessage(thread.id, 'assistant', '', {
      toolCalls: [{ id: 'call-1' }],
    });
    expect(msg.toolCalls).toEqual([{ id: 'call-1' }]);
  });

  it('gets thread', async () => {
    const thread = await manager.createThread();
    const retrieved = await manager.getThread(thread.id);
    expect(retrieved!.id).toBe(thread.id);
  });

  it('returns null for nonexistent thread', async () => {
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

  it('throws on list messages for nonexistent thread', async () => {
    await expect(manager.listMessages('nonexistent')).rejects.toThrow(ThreadNotFoundError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd typescript
npx vitest run tests/management/conversation.test.ts
```

Expected: Import/parse errors for `../../src/management/conversation`.

- [ ] **Step 3: Write minimal implementation**

`typescript/src/management/conversation.ts`:
```typescript
import { Message, Thread } from '../core/models';
import { Storage } from '../core/storage';
import { ThreadNotFoundError } from '../exceptions';

export interface AddMessageOptions {
  name?: string;
  toolCalls?: Record<string, unknown>[];
  toolCallId?: string;
  metadata?: Record<string, unknown>;
}

export class ConversationManager {
  constructor(private storage: Storage) {}

  async createThread(metadata?: Record<string, unknown>): Promise<Thread> {
    return this.storage.createThread(metadata);
  }

  async addMessage(
    threadId: string,
    role: string,
    content: string,
    options: AddMessageOptions = {},
  ): Promise<Message> {
    const message = new Message(role, content, options);
    await this.storage.saveMessage(threadId, message);
    return message;
  }

  async getThread(threadId: string): Promise<Thread | null> {
    return this.storage.getThread(threadId);
  }

  async deleteThread(threadId: string): Promise<void> {
    await this.storage.deleteThread(threadId);
  }

  async listMessages(threadId: string): Promise<Message[]> {
    const thread = await this.storage.getThread(threadId);
    if (!thread) {
      throw new ThreadNotFoundError(threadId);
    }
    return thread.messages;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd typescript
npx vitest run tests/management/conversation.test.ts
```

Expected: 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add typescript/src/management/conversation.ts typescript/tests/management/conversation.test.ts
git commit -m "feat(ts): add ConversationManager

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 7: ContextBuilder

**Files:**
- Create: `typescript/src/assembly/builder.ts`
- Create: `typescript/tests/assembly/builder.test.ts`

- [ ] **Step 1: Write the failing test**

`typescript/tests/assembly/builder.test.ts`:
```typescript
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
    expect(ctx.systemPrompt).toBeUndefined();
  });

  it('injects system prompt', async () => {
    const thread = await storage.createThread();
    await storage.saveMessage(thread.id, new Message('user', 'Hello'));

    const ctx = await builder.forThread(thread.id).withSystemPrompt('You are helpful').build();
    expect(ctx.messages).toHaveLength(2);
    expect(ctx.messages[0].role).toBe('system');
    expect(ctx.messages[0].content).toBe('You are helpful');
    expect(ctx.messages[1].content).toBe('Hello');
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
    expect(ctx.messages).toHaveLength(1);
  });

  it('preserves system message when injecting new one', async () => {
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

    const ctx = await builder.forThread(thread.id)
      .withWindowStrategy(new SlidingWindow(2))
      .withRecentMessages(4)
      .build();
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd typescript
npx vitest run tests/assembly/builder.test.ts
```

Expected: Import/parse errors for `../../src/assembly/builder`.

- [ ] **Step 3: Write minimal implementation**

`typescript/src/assembly/builder.ts`:
```typescript
import { Message, Context } from '../core/models';
import { Storage } from '../core/storage';
import { ConversationManager } from '../management/conversation';
import { WindowStrategy } from '../management/window';
import { ThreadNotFoundError, AssemblyError } from '../exceptions';

export class ContextBuilder {
  private threadId?: string;
  private systemPrompt?: string;
  private windowStrategy?: WindowStrategy;
  private recentMessages = 0;
  private preserveSystem = true;
  private manager: ConversationManager;

  constructor(storage: Storage, manager?: ConversationManager) {
    this.manager = manager ?? new ConversationManager(storage);
  }

  forThread(threadId: string): this {
    this.threadId = threadId;
    return this;
  }

  withSystemPrompt(prompt: string): this {
    this.systemPrompt = prompt;
    return this;
  }

  withWindowStrategy(strategy: WindowStrategy): this {
    this.windowStrategy = strategy;
    return this;
  }

  withRecentMessages(count: number): this {
    this.recentMessages = count;
    return this;
  }

  preserveSystem(preserve: boolean = true): this {
    this.preserveSystem = preserve;
    return this;
  }

  async build(): Promise<Context> {
    if (!this.threadId) {
      throw new AssemblyError('Thread ID not set. Call forThread() first.');
    }

    const thread = await this.manager.getThread(this.threadId);
    if (!thread) {
      throw new ThreadNotFoundError(this.threadId);
    }

    let messages = [...thread.messages];

    if (this.windowStrategy) {
      messages = this.windowStrategy.select(messages);
    }

    if (this.recentMessages > 0) {
      const recent = thread.messages.slice(-this.recentMessages);
      const messageSet = new Set(messages);
      for (const msg of recent) {
        if (!messageSet.has(msg)) {
          messages.push(msg);
        }
      }
      messages.sort((a, b) => thread.messages.indexOf(a) - thread.messages.indexOf(b));
    }

    if (this.systemPrompt) {
      const systemMsg = new Message('system', this.systemPrompt);
      if (this.preserveSystem) {
        messages = [systemMsg, ...messages.filter(m => m.role !== 'system')];
      } else {
        messages = [systemMsg, ...messages];
      }
    }

    const tokenCount = messages.reduce((sum, m) => sum + Math.max(1, Math.floor(m.content.length / 4)), 0);

    const metadata = {
      totalMessages: thread.messages.length,
      selectedMessages: messages.length,
      droppedMessages: thread.messages.length - messages.length,
      windowStrategy: this.windowStrategy?.constructor.name ?? null,
      systemPromptInjected: this.systemPrompt !== undefined,
      tokenEstimate: tokenCount,
    };

    return new Context(messages, {
      systemPrompt: this.systemPrompt,
      tokenCount,
      metadata,
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd typescript
npx vitest run tests/assembly/builder.test.ts
```

Expected: 11 tests pass.

- [ ] **Step 5: Commit**

```bash
git add typescript/src/assembly/builder.ts typescript/tests/assembly/builder.test.ts
git commit -m "feat(ts): add ContextBuilder for assembling LLM context

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 8: OpenAIAdapter

**Files:**
- Create: `typescript/src/adapters/openai.ts`
- Create: `typescript/tests/adapters/openai.test.ts`

- [ ] **Step 1: Write the failing test**

`typescript/tests/adapters/openai.test.ts`:
```typescript
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
    const ctx = new Context([
      new Message('user', 'Hello', { name: 'alice' }),
    ]);
    const result = OpenAIAdapter.toMessages(ctx);
    expect(result[0]).toEqual({ role: 'user', content: 'Hello', name: 'alice' });
  });

  it('includes tool calls', () => {
    const ctx = new Context([
      new Message('assistant', '', {
        toolCalls: [{ id: 'call-1', type: 'function', function: { name: 'get_weather' } }],
      }),
    ]);
    const result = OpenAIAdapter.toMessages(ctx);
    expect(result[0].toolCalls).toEqual([{ id: 'call-1', type: 'function', function: { name: 'get_weather' } }]);
  });

  it('includes tool response', () => {
    const ctx = new Context([
      new Message('tool', 'sunny', { toolCallId: 'call-1' }),
    ]);
    const result = OpenAIAdapter.toMessages(ctx);
    expect(result[0]).toEqual({ role: 'tool', content: 'sunny', toolCallId: 'call-1' });
  });

  it('handles empty context', () => {
    const ctx = new Context([]);
    const result = OpenAIAdapter.toMessages(ctx);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd typescript
npx vitest run tests/adapters/openai.test.ts
```

Expected: Import/parse errors for `../../src/adapters/openai`.

- [ ] **Step 3: Write minimal implementation**

`typescript/src/adapters/openai.ts`:
```typescript
import { Context } from '../core/models';

export interface OpenAIMessage {
  role: string;
  content: string;
  name?: string;
  tool_calls?: Record<string, unknown>[];
  tool_call_id?: string;
}

export class OpenAIAdapter {
  static toMessages(context: Context): OpenAIMessage[] {
    return context.messages.map(msg => {
      const item: OpenAIMessage = {
        role: msg.role,
        content: msg.content,
      };
      if (msg.name) {
        item.name = msg.name;
      }
      if (msg.toolCalls) {
        item.tool_calls = msg.toolCalls;
      }
      if (msg.toolCallId) {
        item.tool_call_id = msg.toolCallId;
      }
      return item;
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd typescript
npx vitest run tests/adapters/openai.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add typescript/src/adapters/openai.ts typescript/tests/adapters/openai.test.ts
git commit -m "feat(ts): add OpenAI adapter

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 9: AnthropicAdapter

**Files:**
- Create: `typescript/src/adapters/anthropic.ts`
- Create: `typescript/tests/adapters/anthropic.test.ts`

- [ ] **Step 1: Write the failing test**

`typescript/tests/adapters/anthropic.test.ts`:
```typescript
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
    const ctx = new Context([
      new Message('user', 'Hello'),
    ]);
    const [messages, system] = AnthropicAdapter.toMessages(ctx);
    expect(system).toBeNull();
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual({ role: 'user', content: 'Hello' });
  });

  it('concatenates multiple system messages', () => {
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd typescript
npx vitest run tests/adapters/anthropic.test.ts
```

Expected: Import/parse errors for `../../src/adapters/anthropic`.

- [ ] **Step 3: Write minimal implementation**

`typescript/src/adapters/anthropic.ts`:
```typescript
import { Context } from '../core/models';

export interface AnthropicMessage {
  role: string;
  content: string;
}

export class AnthropicAdapter {
  static toMessages(context: Context): [AnthropicMessage[], string | null] {
    let systemPrompt: string | null = null;
    const nonSystem: AnthropicMessage[] = [];

    for (const msg of context.messages) {
      if (msg.role === 'system') {
        if (systemPrompt === null) {
          systemPrompt = msg.content;
        } else {
          systemPrompt += '\n\n' + msg.content;
        }
      } else {
        nonSystem.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    return [nonSystem, systemPrompt];
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd typescript
npx vitest run tests/adapters/anthropic.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add typescript/src/adapters/anthropic.ts typescript/tests/adapters/anthropic.test.ts
git commit -m "feat(ts): add Anthropic adapter

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 10: Public API Exports

**Files:**
- Modify: `typescript/src/index.ts`
- Modify: `typescript/src/core/index.ts`
- Modify: `typescript/src/management/index.ts`
- Modify: `typescript/src/assembly/index.ts`
- Modify: `typescript/src/adapters/index.ts`
- Create: `typescript/tests/imports.test.ts`

- [ ] **Step 1: Write the test**

`typescript/tests/imports.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import * as ac from '../src/index';

describe('public API exports', () => {
  it('exports all core classes', () => {
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd typescript
npx vitest run tests/imports.test.ts
```

Expected: Most exports undefined or not found.

- [ ] **Step 3: Write implementation**

`typescript/src/index.ts`:
```typescript
export { Message, Thread, Context } from './core/models';
export { Storage, InMemoryStorage } from './core/storage';
export { ConversationManager } from './management/conversation';
export { WindowStrategy, Tokenizer, SlidingWindow, TokenBudget } from './management/window';
export { ContextBuilder } from './assembly/builder';
export { OpenAIAdapter, OpenAIMessage } from './adapters/openai';
export { AnthropicAdapter, AnthropicMessage } from './adapters/anthropic';
export {
  AgentContextError,
  StorageError,
  ThreadNotFoundError,
  StorageConnectionError,
  ValidationError,
  AssemblyError,
  ThreadEmptyError,
  TokenLimitExceededError,
  AdapterError,
} from './exceptions';
```

`typescript/src/core/index.ts`:
```typescript
export { Message, Thread, Context } from './models';
export { Storage, InMemoryStorage } from './storage';
```

`typescript/src/management/index.ts`:
```typescript
export { ConversationManager, AddMessageOptions } from './conversation';
export { WindowStrategy, Tokenizer, SlidingWindow, TokenBudget } from './window';
```

`typescript/src/assembly/index.ts`:
```typescript
export { ContextBuilder } from './builder';
```

`typescript/src/adapters/index.ts`:
```typescript
export { OpenAIAdapter, OpenAIMessage } from './openai';
export { AnthropicAdapter, AnthropicMessage } from './anthropic';
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd typescript
npx vitest run tests/imports.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add typescript/src/index.ts \
  typescript/src/core/index.ts \
  typescript/src/management/index.ts \
  typescript/src/assembly/index.ts \
  typescript/src/adapters/index.ts \
  typescript/tests/imports.test.ts
git commit -m "feat(ts): wire up public API exports

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 11: Integration Tests

**Files:**
- Create: `typescript/tests/integration.test.ts`

- [ ] **Step 1: Write the test**

`typescript/tests/integration.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  InMemoryStorage,
  ConversationManager,
  ContextBuilder,
  SlidingWindow,
  TokenBudget,
  OpenAIAdapter,
  AnthropicAdapter,
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
    const ctx = await builder.forThread(thread.id).withWindowStrategy(new TokenBudget(25)).build();

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
```

- [ ] **Step 2: Run test to verify it passes**

Run:
```bash
cd typescript
npx vitest run tests/integration.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 3: Run full test suite**

Run:
```bash
cd typescript
npx vitest run
```

Expected: All tests pass (50+ tests).

- [ ] **Step 4: Verify build works**

Run:
```bash
cd typescript
npm run build
```

Expected: `dist/` directory created with `.js` and `.d.ts` files, no errors.

- [ ] **Step 5: Commit**

```bash
git add typescript/tests/integration.test.ts
git commit -m "test(ts): add end-to-end integration tests

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Self-Review

### Spec Coverage

| Spec Section | Task |
|--------------|------|
| Exception hierarchy | Task 2 |
| Core data models (Message, Thread, Context) | Task 3 |
| Storage interface + InMemoryStorage | Task 4 |
| WindowStrategy (SlidingWindow, TokenBudget) | Task 5 |
| ConversationManager | Task 6 |
| ContextBuilder | Task 7 |
| OpenAIAdapter | Task 8 |
| AnthropicAdapter | Task 9 |
| Public API exports | Task 10 |
| Integration tests + build verification | Task 11 |

### Placeholder Scan

- No "TBD", "TODO", or "implement later" found.
- No vague steps — all error cases have explicit tests.
- No "similar to Task N" references.

### Type Consistency

- `Message`, `Thread`, `Context` class fields match across all tasks.
- `Storage` method signatures are consistent between interface and `InMemoryStorage`.
- `WindowStrategy.select()` signature is `select(messages: Message[]): Message[]` throughout.
- `ContextBuilder` chain methods all return `this`.
- `OpenAIAdapter.toMessages()` and `AnthropicAdapter.toMessages()` signatures are static and consistent.
