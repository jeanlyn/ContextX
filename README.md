# Agent Context SDK

A lightweight, zero-dependency SDK for managing AI agent conversation context. Supports conversation history, context window control (sliding window, token budget), and adapters for major LLM providers.

Available in **Python** and **TypeScript** with semantic API parity.

## Features

- **Conversation Management** — Create threads, add messages, track history
- **Context Window Control** — Sliding window and token budget strategies to fit context within LLM limits
- **Structured Assembly** — Build the exact context to send to an LLM with system prompt injection and recent message pinning
- **LLM Adapters** — Convert context to OpenAI and Anthropic message formats out of the box
- **Pluggable Storage** — Memory-only by default; swap in Redis, SQLite, or file-based storage via a simple interface
- **Zero-Dependency Core** — Only optional integrations bring external dependencies

## Quick Start

### Python

```python
import asyncio
from agent_context import (
    InMemoryStorage,
    ConversationManager,
    ContextBuilder,
    SlidingWindow,
    OpenAIAdapter,
)

async def main():
    # Set up
    storage = InMemoryStorage()
    manager = ConversationManager(storage)

    # Create a thread and add messages
    thread = await manager.create_thread()
    await manager.add_message(thread.id, "system", "You are a helpful assistant")
    await manager.add_message(thread.id, "user", "What's the weather?")
    await manager.add_message(thread.id, "assistant", "It's sunny!")

    # Build context for the LLM
    builder = ContextBuilder(storage)
    context = await builder \
        .for_thread(thread.id) \
        .with_window_strategy(SlidingWindow(max_messages=10)) \
        .build()

    # Convert to OpenAI format
    messages = OpenAIAdapter.to_messages(context)
    # -> [{"role": "system", "content": "You are..."}, ...]

asyncio.run(main())
```

### TypeScript

```typescript
import {
  InMemoryStorage,
  ConversationManager,
  ContextBuilder,
  SlidingWindow,
  OpenAIAdapter,
} from 'agent-context';

async function main() {
  const storage = new InMemoryStorage();
  const manager = new ConversationManager(storage);

  const thread = await manager.createThread();
  await manager.addMessage(thread.id, 'system', 'You are a helpful assistant');
  await manager.addMessage(thread.id, 'user', "What's the weather?");
  await manager.addMessage(thread.id, 'assistant', 'It is sunny!');

  const context = await new ContextBuilder(storage)
    .forThread(thread.id)
    .withWindowStrategy(new SlidingWindow(10))
    .build();

  const messages = OpenAIAdapter.toMessages(context);
  // -> [{ role: 'system', content: 'You are...' }, ...]
}

main();
```

## Installation

### Python

```bash
cd python
pip install -e ".[dev]"
pytest tests/ -v
```

### TypeScript

```bash
cd typescript
npm install
npm test
npm run build
```

## Architecture

Four-layer design with clear boundaries:

```
Adapter Layer    (OpenAIAdapter, AnthropicAdapter)
      |
Assembly Layer   (ContextBuilder)
      |
Management Layer (ConversationManager, WindowStrategy)
      |
Core Layer       (Message, Thread, Context, Storage)
```

Each layer depends only on layers below it and can be used independently.

## Window Strategies

Control which messages are included in the context sent to the LLM:

| Strategy | Behavior |
|----------|----------|
| `SlidingWindow(n)` | Keep the most recent N messages |
| `TokenBudget(max_tokens, tokenizer?)` | Accumulate from newest backward until token budget exhausted. Falls back to `len(content) // 4` heuristic if no tokenizer provided. Always preserves `system` messages. |

### Example: Token Budget

```python
from agent_context import TokenBudget, ContextBuilder

context = await builder \
    .for_thread(thread.id) \
    .with_system_prompt("You are helpful") \
    .with_window_strategy(TokenBudget(max_tokens=4000)) \
    .with_recent_messages(3) \
    .build()
```

## Adapters

### OpenAI

```python
from agent_context import OpenAIAdapter

messages = OpenAIAdapter.to_messages(context)
# -> [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}]
```

### Anthropic

```python
from agent_context import AnthropicAdapter

messages, system_prompt = AnthropicAdapter.to_messages(context)
# messages -> [{"role": "user", "content": "..."}]
# system_prompt -> "You are..."
```

## Custom Storage

Implement the `Storage` interface to add persistent backends:

```python
from agent_context import Storage

class RedisStorage(Storage):
    async def create_thread(self, metadata=None): ...
    async def save_message(self, thread_id, message): ...
    async def get_thread(self, thread_id): ...
    async def delete_thread(self, thread_id): ...
    async def list_threads(self, limit=100, offset=0): ...
```

## API Reference

### Core Models

| Class | Fields |
|-------|--------|
| `Message` | `role`, `content`, `name?`, `tool_calls?`, `tool_call_id?`, `metadata?`, `created_at` |
| `Thread` | `id`, `messages[]`, `metadata`, `created_at`, `updated_at` |
| `Context` | `messages[]`, `system_prompt?`, `token_count?`, `metadata` |

### ContextBuilder

Fluent API for assembling LLM context:

| Method | Description |
|--------|-------------|
| `for_thread(id)` | Set the thread to build from |
| `with_system_prompt(prompt)` | Inject a system prompt |
| `with_window_strategy(strategy)` | Apply a window strategy |
| `with_recent_messages(n)` | Always include the last N messages |
| `preserve_system(bool)` | Whether to replace existing system messages |
| `build()` | Assemble and return `Context` |

## Project Structure

```
├── python/              # Python SDK
│   ├── src/agent_context/
│   │   ├── core/        # Message, Thread, Context, Storage
│   │   ├── management/  # ConversationManager, WindowStrategy
│   │   ├── assembly/    # ContextBuilder
│   │   └── adapters/    # OpenAIAdapter, AnthropicAdapter
│   └── tests/
├── typescript/          # TypeScript SDK
│   ├── src/
│   │   ├── core/
│   │   ├── management/
│   │   ├── assembly/
│   │   └── adapters/
│   └── tests/
└── docs/superpowers/
    ├── specs/           # Design specification
    └── plans/           # Implementation plans
```

## Roadmap

| Feature | Status |
|---------|--------|
| Core: Message, Thread, Context | Done |
| Storage: InMemoryStorage | Done |
| Window: SlidingWindow, TokenBudget | Done |
| Adapters: OpenAI, Anthropic | Done |
| Storage plugins (Redis, File, SQLite) | Planned |
| Adapters: Gemini, Ollama, Bedrock | Planned |
| State snapshots (save/restore) | Planned |
| Multi-agent context sharing | Planned |
| Cross-session long-term memory | Planned |

## License

MIT
