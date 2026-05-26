# Agent Context SDK Design

## Overview

A dual-language (Python + TypeScript) SDK for managing AI agent conversation context. It provides conversation history management, context window control (sliding window, token budget), structured context assembly, and adapters for major LLM SDKs.

**MVP Scope**: Conversation history + structured context assembly + OpenAI/Anthropic adapters.
**Advanced features** (state snapshots, multi-agent sharing, cross-session memory) are reserved as extension points for later iterations.

---

## Goals

1. Provide a clean, language-idiomatic API for managing agent conversation context
2. Keep the core zero-dependency — persistence and tokenization are pluggable
3. Support context window management out of the box (sliding window, token budget)
4. Offer adapters that convert context to major LLM SDK input formats
5. Maintain semantic API parity between Python and TypeScript versions

---

## Non-Goals

1. Not an agent framework — no task planning, tool execution, or agent orchestration
2. Not a vector database — long-term memory may integrate with one, but we don't provide it
3. Not a prompt template engine — system prompts are simple strings, not Jinja-like templates

---

## Architecture

Four-layer architecture with clear boundaries:

```
┌──────────────────────────────────────────┐
│  Adapter Layer (OpenAI / Anthropic / …)  │
├──────────────────────────────────────────┤
│  Assembly Layer (ContextBuilder)         │
├──────────────────────────────────────────┤
│  Management Layer (Conversation + Window)│
├──────────────────────────────────────────┤
│  Core Layer (Models + Storage ABC)       │
└──────────────────────────────────────────┘
```

### Design Principles

- **Each layer depends only on layers below it** — adapters depend on assembly, not vice versa
- **Layers are independently usable** — users can use Core + Management without Assembly or Adapters
- **All storage operations are async** — Python uses `async/await`, TypeScript uses `Promise`
- **Zero-dependency core** — only optional integrations bring external dependencies

---

## Core Layer

### Data Models

#### Message

Represents a single message in a conversation.

| Field | Type | Description |
|-------|------|-------------|
| `role` | string | `"system" \| "user" \| "assistant" \| "tool"` |
| `content` | string | Message content |
| `name` | string? | Tool name (for tool role) |
| `tool_calls` | list? | Tool call definitions (for assistant role) |
| `tool_call_id` | string? | Reference to a tool call (for tool role) |
| `metadata` | dict? | Arbitrary extension data |
| `created_at` | datetime | Timestamp |

#### Thread

Represents a conversation thread / session.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique thread identifier |
| `messages` | list[Message] | Ordered message list |
| `metadata` | dict | Thread-level metadata |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |

#### Context

A **view** of a Thread ready to be sent to an LLM. Not persisted.

| Field | Type | Description |
|-------|------|-------------|
| `messages` | list[Message] | Final message list after windowing + assembly |
| `system_prompt` | string? | Injected system prompt |
| `token_count` | int? | Estimated token count (if tokenizer provided) |
| `metadata` | dict | Assembly metadata (e.g., which messages were dropped) |

### Storage Abstract Base Class

```python
class Storage(ABC):
    @abstractmethod
    async def create_thread(self, metadata: dict | None = None) -> Thread: ...

    @abstractmethod
    async def save_message(self, thread_id: str, message: Message) -> None: ...

    @abstractmethod
    async def get_thread(self, thread_id: str) -> Thread | None: ...

    @abstractmethod
    async def delete_thread(self, thread_id: str) -> None: ...

    @abstractmethod
    async def list_threads(self, limit: int = 100, offset: int = 0) -> list[Thread]: ...
```

**Default implementation**: `InMemoryStorage` — zero-dependency, suitable for testing and ephemeral use.

**Future implementations**: `FileStorage`, `RedisStorage`, `SQLiteStorage` (provided as optional packages/plugins).

---

## Management Layer

### ConversationManager

Central interface for conversation lifecycle operations.

```python
class ConversationManager:
    def __init__(self, storage: Storage):
        self.storage = storage

    async def create_thread(self, metadata: dict | None = None) -> Thread: ...

    async def add_message(
        self,
        thread_id: str,
        role: str,
        content: str,
        **kwargs
    ) -> Message: ...

    async def get_thread(self, thread_id: str) -> Thread | None: ...

    async def delete_thread(self, thread_id: str) -> None: ...

    async def list_messages(self, thread_id: str) -> list[Message]: ...
```

### WindowStrategy

Determines which messages from a Thread should be included in the context, given constraints.

```python
class WindowStrategy(ABC):
    @abstractmethod
    def select(self, messages: list[Message], max_tokens: int) -> list[Message]: ...
```

**Built-in strategies (MVP)**:

| Strategy | Behavior |
|----------|----------|
| `SlidingWindow(max_messages: int)` | Keep the most recent N messages |
| `TokenBudget(max_tokens: int, tokenizer: Tokenizer \| None)` | Accumulate from newest backward until token budget is exhausted. If no tokenizer, falls back to character count / 4 heuristic. Always preserves `system` messages unless explicitly disabled. |

**Future strategies**: summary compression, relevance-based selection, time-decay weighting.

### Tokenizer

Optional abstraction for precise token counting:

```python
class Tokenizer(ABC):
    @abstractmethod
    def count(self, text: str) -> int: ...
```

If not provided, `TokenBudget` uses a rough heuristic (`len(text) // 4`) to stay zero-dependency.

---

## Assembly Layer

### ContextBuilder

Declarative builder for assembling the final context to send to an LLM.

```python
class ContextBuilder:
    def __init__(self, storage: Storage, manager: ConversationManager | None = None):
        self.storage = storage
        self.manager = manager or ConversationManager(storage)

    def for_thread(self, thread_id: str) -> "ContextBuilder": ...

    def with_system_prompt(self, prompt: str) -> "ContextBuilder": ...

    def with_window_strategy(self, strategy: WindowStrategy) -> "ContextBuilder": ...

    def with_recent_messages(self, count: int) -> "ContextBuilder": ...

    def preserve_system(self, preserve: bool = True) -> "ContextBuilder": ...

    async def build(self) -> Context: ...
```

**Assembly rules**:

1. Load thread from storage
2. Inject system prompt as the first message (if provided)
3. Apply window strategy to select messages
4. Ensure `with_recent_messages(n)` messages are always included (even if they exceed token budget)
5. Return `Context` with final messages, token estimate, and metadata

### Context Metadata

The `Context.metadata` dict includes assembly diagnostics:

```python
{
    "total_messages": 42,
    "selected_messages": 10,
    "dropped_messages": 32,
    "window_strategy": "TokenBudget",
    "system_prompt_injected": True,
    "token_estimate": 3892,
}
```

---

## Adapter Layer

Converts `Context` to LLM SDK-specific input formats.

### OpenAIAdapter

```python
class OpenAIAdapter:
    @staticmethod
    def to_messages(context: Context) -> list[dict]:
        """Returns list[ChatCompletionMessageParam]"""
```

Handles:
- Standard role mapping
- Tool call format normalization

### AnthropicAdapter

```python
class AnthropicAdapter:
    @staticmethod
    def to_messages(context: Context) -> tuple[list[dict], str | None]:
        """Returns (messages, system_prompt).
        Anthropic separates system prompt from message list."""
```

Handles:
- System prompt extraction to separate parameter
- Role mapping (Anthropic uses `"user" \| "assistant"`, no `"system"` in messages)

### Future Adapters

- `GeminiAdapter`
- `OllamaAdapter`
- `BedrockAdapter`

---

## Error Handling

Unified exception hierarchy:

```
AgentContextError
├── StorageError
│   ├── ThreadNotFoundError
│   └── StorageConnectionError
├── ValidationError
├── AssemblyError
│   ├── ThreadEmptyError
│   └── TokenLimitExceededError
└── AdapterError
```

- All public async methods may raise `AgentContextError` subclasses
- Error messages are actionable (include thread_id, relevant field names)

---

## Project Structure

```
agent-context-sdk/
├── python/
│   ├── src/agent_context/
│   │   ├── __init__.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── models.py        # Message, Thread, Context
│   │   │   └── storage.py       # Storage ABC, InMemoryStorage
│   │   ├── management/
│   │   │   ├── __init__.py
│   │   │   ├── conversation.py  # ConversationManager
│   │   │   └── window.py        # WindowStrategy, SlidingWindow, TokenBudget
│   │   ├── assembly/
│   │   │   ├── __init__.py
│   │   │   └── builder.py       # ContextBuilder
│   │   ├── adapters/
│   │   │   ├── __init__.py
│   │   │   ├── openai.py
│   │   │   └── anthropic.py
│   │   └── exceptions.py        # All error classes
│   ├── tests/
│   └── pyproject.toml
├── typescript/
│   ├── src/
│   │   ├── core/
│   │   ├── management/
│   │   ├── assembly/
│   │   ├── adapters/
│   │   └── index.ts
│   ├── tests/
│   └── package.json
├── docs/
│   ├── python/
│   └── typescript/
└── README.md
```

### Package Names

- **Python**: `agent-context` on PyPI (`pip install agent-context`)
- **TypeScript**: `agent-context` on npm (`npm install agent-context`)

### API Naming Convention

- **Python**: `snake_case` throughout, PEP 8 compliant
- **TypeScript**: `camelCase` for methods/properties, `PascalCase` for classes
- Semantic API parity: same classes, same methods, same behavior, different naming conventions

---

## MVP Scope

### Included

| Component | Detail |
|-----------|--------|
| Core | `Message`, `Thread`, `Context` dataclasses; `Storage` ABC; `InMemoryStorage` |
| Management | `ConversationManager`; `SlidingWindow`; `TokenBudget` (with heuristic fallback) |
| Assembly | `ContextBuilder` with system prompt injection, window strategy, recent message pinning |
| Adapters | `OpenAIAdapter`, `AnthropicAdapter` |
| Errors | Full exception hierarchy |
| Tests | Unit tests for all MVP components in both languages |

### Explicitly Excluded (Future Iterations)

| Feature | Planned Version |
|---------|-----------------|
| File/Redis/SQLite storage plugins | v0.2 |
| Gemini / Ollama / Bedrock adapters | v0.2 |
| State snapshots (save/restore) | v0.3 |
| Summary compression window strategy | v0.3 |
| Multi-agent context sharing | v0.4 |
| Cross-session long-term memory | v0.5 |
| Built-in tiktoken integration | v0.2 (optional) |

---

## Testing Strategy

- **Unit tests**: Each layer tested in isolation with mock storage
- **Integration tests**: End-to-end flow (create thread → add messages → build context → adapt to OpenAI format)
- **Cross-language parity tests**: Same test scenarios expressed in both Python and TypeScript to ensure behavioral consistency
- **No mocking of storage in core tests** — use `InMemoryStorage` as the real lightweight dependency

---

## Open Questions (Resolved)

| Question | Decision |
|----------|----------|
| Persistent storage in core? | No — memory-only default, pluggable storage interface |
| Relationship with LLM frameworks? | Core is agnostic; adapters bridge to specific SDKs |
| Async vs sync API? | All storage and builder operations are async/Promise-based |
| Token counting dependency? | Optional Tokenizer; heuristic fallback keeps core zero-dep |
| System prompt handling? | Always injected as first message by default; user can disable |
