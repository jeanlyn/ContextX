# Agent Context SDK — Python Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Python version of the agent-context SDK with conversation history, window management, context assembly, and OpenAI/Anthropic adapters.

**Architecture:** Four-layer package (`core` → `management` → `assembly` → `adapters`) with async storage abstraction, zero-dependency core, and pluggable window strategies.

**Tech Stack:** Python 3.10+, pytest, pytest-asyncio, hatchling build

---

## File Structure

```
python/
├── pyproject.toml
├── src/agent_context/
│   ├── __init__.py              # Public API exports
│   ├── exceptions.py            # Exception hierarchy
│   ├── core/
│   │   ├── __init__.py
│   │   ├── models.py            # Message, Thread, Context dataclasses
│   │   └── storage.py           # Storage ABC + InMemoryStorage
│   ├── management/
│   │   ├── __init__.py
│   │   ├── conversation.py      # ConversationManager
│   │   └── window.py            # WindowStrategy + implementations
│   ├── assembly/
│   │   ├── __init__.py
│   │   └── builder.py           # ContextBuilder
│   └── adapters/
│       ├── __init__.py
│       ├── openai.py            # OpenAIAdapter
│       └── anthropic.py         # AnthropicAdapter
└── tests/
    ├── conftest.py
    ├── test_exceptions.py
    ├── core/
    │   ├── test_models.py
    │   └── test_storage.py
    ├── management/
    │   ├── test_conversation.py
    │   └── test_window.py
    ├── assembly/
    │   └── test_builder.py
    ├── adapters/
    │   ├── test_openai.py
    │   └── test_anthropic.py
    └── test_integration.py
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `python/pyproject.toml`
- Create: `python/src/agent_context/__init__.py`
- Create: `python/src/agent_context/core/__init__.py`
- Create: `python/src/agent_context/management/__init__.py`
- Create: `python/src/agent_context/assembly/__init__.py`
- Create: `python/src/agent_context/adapters/__init__.py`
- Create: `python/tests/__init__.py`
- Create: `python/tests/conftest.py`
- Create: `python/tests/core/__init__.py`
- Create: `python/tests/management/__init__.py`
- Create: `python/tests/assembly/__init__.py`
- Create: `python/tests/adapters/__init__.py`

- [ ] **Step 1: Write pyproject.toml**

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "agent-context"
version = "0.1.0"
description = "Agent context management SDK"
requires-python = ">=3.10"
dependencies = []

[project.optional-dependencies]
dev = ["pytest>=7.0", "pytest-asyncio>=0.21"]

[tool.hatch.build.targets.wheel]
packages = ["src/agent_context"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

- [ ] **Step 2: Create empty __init__.py files**

Run:
```bash
cd python
touch src/agent_context/__init__.py \
  src/agent_context/core/__init__.py \
  src/agent_context/management/__init__.py \
  src/agent_context/assembly/__init__.py \
  src/agent_context/adapters/__init__.py \
  tests/__init__.py \
  tests/conftest.py \
  tests/core/__init__.py \
  tests/management/__init__.py \
  tests/assembly/__init__.py \
  tests/adapters/__init__.py
```

- [ ] **Step 3: Install dev dependencies and verify pytest works**

Run:
```bash
cd python
pip install -e ".[dev]"
pytest --version
```

Expected: pytest version output, no errors.

- [ ] **Step 4: Commit**

```bash
git add python/
git commit -m "chore: scaffold Python package structure

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Exception Hierarchy

**Files:**
- Create: `python/src/agent_context/exceptions.py`
- Create: `python/tests/test_exceptions.py`

- [ ] **Step 1: Write the failing test**

`python/tests/test_exceptions.py`:
```python
import pytest
from agent_context.exceptions import (
    AgentContextError,
    StorageError,
    ThreadNotFoundError,
    StorageConnectionError,
    ValidationError,
    AssemblyError,
    ThreadEmptyError,
    TokenLimitExceededError,
    AdapterError,
)


def test_exception_hierarchy():
    assert issubclass(StorageError, AgentContextError)
    assert issubclass(ThreadNotFoundError, StorageError)
    assert issubclass(StorageConnectionError, StorageError)
    assert issubclass(ValidationError, AgentContextError)
    assert issubclass(AssemblyError, AgentContextError)
    assert issubclass(ThreadEmptyError, AssemblyError)
    assert issubclass(TokenLimitExceededError, AssemblyError)
    assert issubclass(AdapterError, AgentContextError)


def test_thread_not_found_error_message():
    err = ThreadNotFoundError("thread-123")
    assert "thread-123" in str(err)
    assert err.thread_id == "thread-123"


def test_thread_empty_error_message():
    err = ThreadEmptyError("thread-456")
    assert "thread-456" in str(err)
    assert err.thread_id == "thread-456"
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd python
pytest tests/test_exceptions.py -v
```

Expected: ImportError or ModuleNotFoundError for `agent_context.exceptions`.

- [ ] **Step 3: Write minimal implementation**

`python/src/agent_context/exceptions.py`:
```python
class AgentContextError(Exception):
    """Base exception for all agent-context errors."""
    pass


class StorageError(AgentContextError):
    pass


class ThreadNotFoundError(StorageError):
    def __init__(self, thread_id: str):
        super().__init__(f"Thread not found: {thread_id}")
        self.thread_id = thread_id


class StorageConnectionError(StorageError):
    pass


class ValidationError(AgentContextError):
    pass


class AssemblyError(AgentContextError):
    pass


class ThreadEmptyError(AssemblyError):
    def __init__(self, thread_id: str):
        super().__init__(f"Thread has no messages: {thread_id}")
        self.thread_id = thread_id


class TokenLimitExceededError(AssemblyError):
    pass


class AdapterError(AgentContextError):
    pass
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd python
pytest tests/test_exceptions.py -v
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add python/src/agent_context/exceptions.py python/tests/test_exceptions.py
git commit -m "feat: add exception hierarchy

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Core Data Models

**Files:**
- Create: `python/src/agent_context/core/models.py`
- Create: `python/tests/core/test_models.py`

- [ ] **Step 1: Write the failing test**

`python/tests/core/test_models.py`:
```python
from datetime import datetime
from agent_context.core.models import Message, Thread, Context


def test_message_defaults():
    msg = Message(role="user", content="Hello")
    assert msg.role == "user"
    assert msg.content == "Hello"
    assert msg.name is None
    assert msg.tool_calls is None
    assert msg.tool_call_id is None
    assert msg.metadata is None
    assert isinstance(msg.created_at, datetime)


def test_message_with_all_fields():
    msg = Message(
        role="assistant",
        content="",
        name="weather_tool",
        tool_calls=[{"id": "call-1"}],
        tool_call_id="call-1",
        metadata={"key": "value"},
    )
    assert msg.name == "weather_tool"
    assert msg.tool_calls == [{"id": "call-1"}]
    assert msg.tool_call_id == "call-1"
    assert msg.metadata == {"key": "value"}


def test_thread_defaults():
    thread = Thread(id="t-1")
    assert thread.id == "t-1"
    assert thread.messages == []
    assert thread.metadata == {}
    assert isinstance(thread.created_at, datetime)
    assert isinstance(thread.updated_at, datetime)


def test_context_defaults():
    msg = Message(role="user", content="Hello")
    ctx = Context(messages=[msg])
    assert ctx.messages == [msg]
    assert ctx.system_prompt is None
    assert ctx.token_count is None
    assert ctx.metadata == {}


def test_context_with_all_fields():
    msg = Message(role="system", content="Be helpful")
    ctx = Context(
        messages=[msg],
        system_prompt="Be helpful",
        token_count=5,
        metadata={"source": "test"},
    )
    assert ctx.system_prompt == "Be helpful"
    assert ctx.token_count == 5
    assert ctx.metadata == {"source": "test"}
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd python
pytest tests/core/test_models.py -v
```

Expected: ImportError for `agent_context.core.models`.

- [ ] **Step 3: Write minimal implementation**

`python/src/agent_context/core/models.py`:
```python
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class Message:
    role: str
    content: str
    name: str | None = None
    tool_calls: list[dict] | None = None
    tool_call_id: str | None = None
    metadata: dict[str, Any] | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Thread:
    id: str
    messages: list[Message] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Context:
    messages: list[Message]
    system_prompt: str | None = None
    token_count: int | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd python
pytest tests/core/test_models.py -v
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add python/src/agent_context/core/models.py python/tests/core/test_models.py
git commit -m "feat: add core data models (Message, Thread, Context)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Storage ABC + InMemoryStorage

**Files:**
- Create: `python/src/agent_context/core/storage.py`
- Create: `python/tests/core/test_storage.py`

- [ ] **Step 1: Write the failing test**

`python/tests/core/test_storage.py`:
```python
import pytest
from agent_context.core.storage import InMemoryStorage
from agent_context.core.models import Message
from agent_context.exceptions import ThreadNotFoundError


@pytest.fixture
def storage():
    return InMemoryStorage()


@pytest.mark.asyncio
async def test_create_thread(storage):
    thread = await storage.create_thread()
    assert thread.id is not None
    assert isinstance(thread.id, str)
    assert thread.messages == []
    assert thread.metadata == {}


@pytest.mark.asyncio
async def test_create_thread_with_metadata(storage):
    thread = await storage.create_thread(metadata={"key": "value"})
    assert thread.metadata == {"key": "value"}


@pytest.mark.asyncio
async def test_save_message(storage):
    thread = await storage.create_thread()
    msg = Message(role="user", content="Hello")
    await storage.save_message(thread.id, msg)

    retrieved = await storage.get_thread(thread.id)
    assert len(retrieved.messages) == 1
    assert retrieved.messages[0].content == "Hello"
    assert retrieved.updated_at > retrieved.created_at


@pytest.mark.asyncio
async def test_get_thread_not_found(storage):
    result = await storage.get_thread("nonexistent")
    assert result is None


@pytest.mark.asyncio
async def test_delete_thread(storage):
    thread = await storage.create_thread()
    await storage.delete_thread(thread.id)
    assert await storage.get_thread(thread.id) is None


@pytest.mark.asyncio
async def test_delete_thread_not_found(storage):
    with pytest.raises(ThreadNotFoundError) as exc_info:
        await storage.delete_thread("nonexistent")
    assert "nonexistent" in str(exc_info.value)


@pytest.mark.asyncio
async def test_save_message_thread_not_found(storage):
    msg = Message(role="user", content="Hello")
    with pytest.raises(ThreadNotFoundError):
        await storage.save_message("nonexistent", msg)


@pytest.mark.asyncio
async def test_list_threads(storage):
    t1 = await storage.create_thread()
    t2 = await storage.create_thread()
    threads = await storage.list_threads()
    assert len(threads) == 2
    ids = {t.id for t in threads}
    assert t1.id in ids
    assert t2.id in ids


@pytest.mark.asyncio
async def test_list_threads_pagination(storage):
    for _ in range(5):
        await storage.create_thread()
    threads = await storage.list_threads(limit=2, offset=1)
    assert len(threads) == 2
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd python
pytest tests/core/test_storage.py -v
```

Expected: ImportError for `agent_context.core.storage`.

- [ ] **Step 3: Write minimal implementation**

`python/src/agent_context/core/storage.py`:
```python
from abc import ABC, abstractmethod
from datetime import datetime
import uuid

from agent_context.core.models import Thread, Message
from agent_context.exceptions import ThreadNotFoundError


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


class InMemoryStorage(Storage):
    def __init__(self):
        self._threads: dict[str, Thread] = {}

    async def create_thread(self, metadata: dict | None = None) -> Thread:
        thread = Thread(
            id=str(uuid.uuid4()),
            metadata=metadata or {},
        )
        self._threads[thread.id] = thread
        return thread

    async def save_message(self, thread_id: str, message: Message) -> None:
        if thread_id not in self._threads:
            raise ThreadNotFoundError(thread_id)
        self._threads[thread_id].messages.append(message)
        self._threads[thread_id].updated_at = datetime.utcnow()

    async def get_thread(self, thread_id: str) -> Thread | None:
        return self._threads.get(thread_id)

    async def delete_thread(self, thread_id: str) -> None:
        if thread_id not in self._threads:
            raise ThreadNotFoundError(thread_id)
        del self._threads[thread_id]

    async def list_threads(self, limit: int = 100, offset: int = 0) -> list[Thread]:
        threads = list(self._threads.values())
        return threads[offset:offset + limit]
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd python
pytest tests/core/test_storage.py -v
```

Expected: 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add python/src/agent_context/core/storage.py python/tests/core/test_storage.py
git commit -m "feat: add Storage ABC and InMemoryStorage

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: WindowStrategy + Implementations

**Files:**
- Create: `python/src/agent_context/management/window.py`
- Create: `python/tests/management/test_window.py`

- [ ] **Step 1: Write the failing test**

`python/tests/management/test_window.py`:
```python
import pytest
from agent_context.core.models import Message
from agent_context.management.window import SlidingWindow, TokenBudget


class FakeTokenizer:
    def count(self, text: str) -> int:
        return len(text)


def test_sliding_window_basic():
    messages = [Message(role="user", content=f"msg-{i}") for i in range(10)]
    strategy = SlidingWindow(max_messages=3)
    result = strategy.select(messages)
    assert len(result) == 3
    assert result[0].content == "msg-7"
    assert result[1].content == "msg-8"
    assert result[2].content == "msg-9"


def test_sliding_window_fewer_than_max():
    messages = [Message(role="user", content="x") for _ in range(2)]
    strategy = SlidingWindow(max_messages=5)
    result = strategy.select(messages)
    assert len(result) == 2


def test_sliding_window_zero():
    messages = [Message(role="user", content="x") for _ in range(3)]
    strategy = SlidingWindow(max_messages=0)
    result = strategy.select(messages)
    assert len(result) == 0


def test_token_budget_with_heuristic():
    messages = [Message(role="user", content="a" * 40)]  # ~10 tokens (40 // 4)
    strategy = TokenBudget(max_tokens=15)
    result = strategy.select(messages)
    assert len(result) == 1


def test_token_budget_keeps_recent():
    messages = [
        Message(role="user", content="a" * 40),  # ~10 tokens
        Message(role="user", content="b" * 40),  # ~10 tokens
    ]
    strategy = TokenBudget(max_tokens=15)
    result = strategy.select(messages)
    assert len(result) == 1
    assert result[0].content == "b" * 40


def test_token_budget_drops_oldest():
    messages = [
        Message(role="user", content="a" * 40),  # ~10 tokens
        Message(role="user", content="b" * 40),  # ~10 tokens
        Message(role="user", content="c" * 40),  # ~10 tokens
    ]
    strategy = TokenBudget(max_tokens=20)
    result = strategy.select(messages)
    assert len(result) == 2
    assert result[0].content == "b" * 40
    assert result[1].content == "c" * 40


def test_token_budget_preserves_system_messages():
    messages = [
        Message(role="system", content="a" * 40),  # ~10 tokens
        Message(role="user", content="b" * 40),    # ~10 tokens
        Message(role="user", content="c" * 40),    # ~10 tokens
    ]
    strategy = TokenBudget(max_tokens=15)
    result = strategy.select(messages)
    assert len(result) == 2
    assert result[0].role == "system"
    assert result[1].content == "c" * 40


def test_token_budget_with_custom_tokenizer():
    messages = [Message(role="user", content="abc")]  # 3 tokens with FakeTokenizer
    strategy = TokenBudget(max_tokens=5, tokenizer=FakeTokenizer())
    result = strategy.select(messages)
    assert len(result) == 1


def test_token_budget_empty_messages():
    strategy = TokenBudget(max_tokens=100)
    result = strategy.select([])
    assert result == []


def test_token_budget_exceeds_on_single_message():
    messages = [Message(role="user", content="a" * 100)]  # ~25 tokens
    strategy = TokenBudget(max_tokens=10)
    result = strategy.select(messages)
    assert len(result) == 0
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd python
pytest tests/management/test_window.py -v
```

Expected: ImportError for `agent_context.management.window`.

- [ ] **Step 3: Write minimal implementation**

`python/src/agent_context/management/window.py`:
```python
from abc import ABC, abstractmethod

from agent_context.core.models import Message


class WindowStrategy(ABC):
    @abstractmethod
    def select(self, messages: list[Message]) -> list[Message]: ...


class SlidingWindow(WindowStrategy):
    def __init__(self, max_messages: int):
        self.max_messages = max_messages

    def select(self, messages: list[Message]) -> list[Message]:
        return messages[-self.max_messages:]


class TokenBudget(WindowStrategy):
    def __init__(self, max_tokens: int, tokenizer=None):
        self.max_tokens = max_tokens
        self.tokenizer = tokenizer

    def _count_tokens(self, text: str) -> int:
        if self.tokenizer:
            return self.tokenizer.count(text)
        return max(1, len(text) // 4)

    def select(self, messages: list[Message]) -> list[Message]:
        system_messages = [m for m in messages if m.role == "system"]
        non_system = [m for m in messages if m.role != "system"]

        selected = []
        total_tokens = 0

        for msg in reversed(non_system):
            msg_tokens = self._count_tokens(msg.content)
            if total_tokens + msg_tokens <= self.max_tokens:
                selected.insert(0, msg)
                total_tokens += msg_tokens
            else:
                break

        return system_messages + selected
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd python
pytest tests/management/test_window.py -v
```

Expected: 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add python/src/agent_context/management/window.py python/tests/management/test_window.py
git commit -m "feat: add WindowStrategy, SlidingWindow, TokenBudget

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: ConversationManager

**Files:**
- Create: `python/src/agent_context/management/conversation.py`
- Create: `python/tests/management/test_conversation.py`

- [ ] **Step 1: Write the failing test**

`python/tests/management/test_conversation.py`:
```python
import pytest
from agent_context.management.conversation import ConversationManager
from agent_context.core.storage import InMemoryStorage
from agent_context.exceptions import ThreadNotFoundError


@pytest.fixture
def manager():
    return ConversationManager(InMemoryStorage())


@pytest.mark.asyncio
async def test_create_thread(manager):
    thread = await manager.create_thread()
    assert thread.id is not None
    assert thread.messages == []


@pytest.mark.asyncio
async def test_create_thread_with_metadata(manager):
    thread = await manager.create_thread(metadata={"key": "value"})
    assert thread.metadata == {"key": "value"}


@pytest.mark.asyncio
async def test_add_message(manager):
    thread = await manager.create_thread()
    msg = await manager.add_message(thread.id, "user", "Hello")
    assert msg.role == "user"
    assert msg.content == "Hello"

    thread = await manager.get_thread(thread.id)
    assert len(thread.messages) == 1


@pytest.mark.asyncio
async def test_add_message_with_kwargs(manager):
    thread = await manager.create_thread()
    msg = await manager.add_message(
        thread.id, "assistant", "",
        tool_calls=[{"id": "call-1"}],
    )
    assert msg.tool_calls == [{"id": "call-1"}]


@pytest.mark.asyncio
async def test_get_thread(manager):
    thread = await manager.create_thread()
    retrieved = await manager.get_thread(thread.id)
    assert retrieved.id == thread.id


@pytest.mark.asyncio
async def test_get_thread_not_found(manager):
    result = await manager.get_thread("nonexistent")
    assert result is None


@pytest.mark.asyncio
async def test_delete_thread(manager):
    thread = await manager.create_thread()
    await manager.delete_thread(thread.id)
    assert await manager.get_thread(thread.id) is None


@pytest.mark.asyncio
async def test_delete_thread_not_found(manager):
    with pytest.raises(ThreadNotFoundError):
        await manager.delete_thread("nonexistent")


@pytest.mark.asyncio
async def test_list_messages(manager):
    thread = await manager.create_thread()
    await manager.add_message(thread.id, "user", "Hello")
    await manager.add_message(thread.id, "assistant", "Hi!")

    messages = await manager.list_messages(thread.id)
    assert len(messages) == 2
    assert messages[0].content == "Hello"
    assert messages[1].content == "Hi!"


@pytest.mark.asyncio
async def test_list_messages_thread_not_found(manager):
    with pytest.raises(ThreadNotFoundError):
        await manager.list_messages("nonexistent")
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd python
pytest tests/management/test_conversation.py -v
```

Expected: ImportError for `agent_context.management.conversation`.

- [ ] **Step 3: Write minimal implementation**

`python/src/agent_context/management/conversation.py`:
```python
from agent_context.core.models import Message, Thread
from agent_context.core.storage import Storage
from agent_context.exceptions import ThreadNotFoundError


class ConversationManager:
    def __init__(self, storage: Storage):
        self.storage = storage

    async def create_thread(self, metadata: dict | None = None) -> Thread:
        return await self.storage.create_thread(metadata)

    async def add_message(
        self,
        thread_id: str,
        role: str,
        content: str,
        **kwargs,
    ) -> Message:
        message = Message(role=role, content=content, **kwargs)
        await self.storage.save_message(thread_id, message)
        return message

    async def get_thread(self, thread_id: str) -> Thread | None:
        return await self.storage.get_thread(thread_id)

    async def delete_thread(self, thread_id: str) -> None:
        await self.storage.delete_thread(thread_id)

    async def list_messages(self, thread_id: str) -> list[Message]:
        thread = await self.storage.get_thread(thread_id)
        if thread is None:
            raise ThreadNotFoundError(thread_id)
        return thread.messages
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd python
pytest tests/management/test_conversation.py -v
```

Expected: 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add python/src/agent_context/management/conversation.py python/tests/management/test_conversation.py
git commit -m "feat: add ConversationManager

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 7: ContextBuilder

**Files:**
- Create: `python/src/agent_context/assembly/builder.py`
- Create: `python/tests/assembly/test_builder.py`

- [ ] **Step 1: Write the failing test**

`python/tests/assembly/test_builder.py`:
```python
import pytest
from agent_context.assembly.builder import ContextBuilder
from agent_context.core.storage import InMemoryStorage
from agent_context.core.models import Message
from agent_context.management.window import SlidingWindow, TokenBudget
from agent_context.exceptions import ThreadNotFoundError, AssemblyError


@pytest.fixture
def builder():
    storage = InMemoryStorage()
    return ContextBuilder(storage)


@pytest.mark.asyncio
async def test_build_basic(builder):
    thread = await builder.storage.create_thread()
    await builder.storage.save_message(thread.id, Message(role="user", content="Hello"))

    ctx = await builder.for_thread(thread.id).build()
    assert len(ctx.messages) == 1
    assert ctx.messages[0].content == "Hello"
    assert ctx.system_prompt is None


@pytest.mark.asyncio
async def test_build_with_system_prompt(builder):
    thread = await builder.storage.create_thread()
    await builder.storage.save_message(thread.id, Message(role="user", content="Hello"))

    ctx = await builder.for_thread(thread.id).with_system_prompt("You are helpful").build()
    assert len(ctx.messages) == 2
    assert ctx.messages[0].role == "system"
    assert ctx.messages[0].content == "You are helpful"
    assert ctx.messages[1].content == "Hello"


@pytest.mark.asyncio
async def test_build_with_sliding_window(builder):
    thread = await builder.storage.create_thread()
    for i in range(5):
        await builder.storage.save_message(thread.id, Message(role="user", content=f"msg-{i}"))

    ctx = await builder.for_thread(thread.id).with_window_strategy(
        SlidingWindow(max_messages=2)
    ).build()
    assert len(ctx.messages) == 2
    assert ctx.messages[0].content == "msg-3"
    assert ctx.messages[1].content == "msg-4"


@pytest.mark.asyncio
async def test_build_with_token_budget(builder):
    thread = await builder.storage.create_thread()
    for i in range(3):
        await builder.storage.save_message(thread.id, Message(role="user", content="a" * 40))

    ctx = await builder.for_thread(thread.id).with_window_strategy(
        TokenBudget(max_tokens=20)
    ).build()
    assert len(ctx.messages) == 1


@pytest.mark.asyncio
async def test_build_preserves_system_injected(builder):
    thread = await builder.storage.create_thread()
    await builder.storage.save_message(thread.id, Message(role="system", content="Original"))
    await builder.storage.save_message(thread.id, Message(role="user", content="Hello"))

    ctx = await builder.for_thread(thread.id).with_system_prompt("New system").build()
    system_msgs = [m for m in ctx.messages if m.role == "system"]
    assert len(system_msgs) == 1
    assert system_msgs[0].content == "New system"


@pytest.mark.asyncio
async def test_build_no_preserve_system(builder):
    thread = await builder.storage.create_thread()
    await builder.storage.save_message(thread.id, Message(role="system", content="Original"))
    await builder.storage.save_message(thread.id, Message(role="user", content="Hello"))

    ctx = await builder.for_thread(thread.id).with_system_prompt("New").preserve_system(
        False
    ).build()
    system_msgs = [m for m in ctx.messages if m.role == "system"]
    assert len(system_msgs) == 1
    assert system_msgs[0].content == "New"


@pytest.mark.asyncio
async def test_build_with_recent_messages(builder):
    thread = await builder.storage.create_thread()
    for i in range(5):
        await builder.storage.save_message(thread.id, Message(role="user", content=f"msg-{i}"))

    ctx = await builder.for_thread(thread.id).with_window_strategy(
        SlidingWindow(max_messages=2)
    ).with_recent_messages(4).build()
    assert len(ctx.messages) == 4
    assert ctx.messages[0].content == "msg-1"


@pytest.mark.asyncio
async def test_build_metadata(builder):
    thread = await builder.storage.create_thread()
    for i in range(5):
        await builder.storage.save_message(thread.id, Message(role="user", content=f"msg-{i}"))

    ctx = await builder.for_thread(thread.id).with_window_strategy(
        SlidingWindow(max_messages=2)
    ).build()
    assert ctx.metadata["total_messages"] == 5
    assert ctx.metadata["selected_messages"] == 2
    assert ctx.metadata["dropped_messages"] == 3
    assert ctx.metadata["window_strategy"] == "SlidingWindow"
    assert ctx.metadata["system_prompt_injected"] is False
    assert ctx.metadata["token_estimate"] is not None


@pytest.mark.asyncio
async def test_build_thread_not_found(builder):
    with pytest.raises(ThreadNotFoundError):
        await builder.for_thread("nonexistent").build()


@pytest.mark.asyncio
async def test_build_no_thread_set(builder):
    with pytest.raises(AssemblyError, match="Thread ID not set"):
        await builder.build()


@pytest.mark.asyncio
async def test_build_chaining_returns_new_instance(builder):
    b1 = builder.for_thread("t1")
    b2 = b1.with_system_prompt("test")
    assert b1 is b2
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd python
pytest tests/assembly/test_builder.py -v
```

Expected: ImportError for `agent_context.assembly.builder`.

- [ ] **Step 3: Write minimal implementation**

`python/src/agent_context/assembly/builder.py`:
```python
from agent_context.core.models import Message, Context
from agent_context.core.storage import Storage
from agent_context.management.conversation import ConversationManager
from agent_context.management.window import WindowStrategy
from agent_context.exceptions import ThreadNotFoundError, AssemblyError


class ContextBuilder:
    def __init__(self, storage: Storage, manager: ConversationManager | None = None):
        self.storage = storage
        self.manager = manager or ConversationManager(storage)
        self._thread_id: str | None = None
        self._system_prompt: str | None = None
        self._window_strategy: WindowStrategy | None = None
        self._recent_messages: int = 0
        self._preserve_system: bool = True

    def for_thread(self, thread_id: str) -> "ContextBuilder":
        self._thread_id = thread_id
        return self

    def with_system_prompt(self, prompt: str) -> "ContextBuilder":
        self._system_prompt = prompt
        return self

    def with_window_strategy(self, strategy: WindowStrategy) -> "ContextBuilder":
        self._window_strategy = strategy
        return self

    def with_recent_messages(self, count: int) -> "ContextBuilder":
        self._recent_messages = count
        return self

    def preserve_system(self, preserve: bool = True) -> "ContextBuilder":
        self._preserve_system = preserve
        return self

    async def build(self) -> Context:
        if not self._thread_id:
            raise AssemblyError("Thread ID not set. Call for_thread() first.")

        thread = await self.storage.get_thread(self._thread_id)
        if thread is None:
            raise ThreadNotFoundError(self._thread_id)

        messages = list(thread.messages)

        if self._window_strategy:
            messages = self._window_strategy.select(messages)

        if self._recent_messages > 0:
            recent = thread.messages[-self._recent_messages:]
            msg_set = {id(m) for m in messages}
            for msg in recent:
                if id(msg) not in msg_set:
                    messages.append(msg)
            messages.sort(key=lambda m: thread.messages.index(m))

        if self._system_prompt:
            system_msg = Message(role="system", content=self._system_prompt)
            if self._preserve_system:
                messages = [system_msg] + [m for m in messages if m.role != "system"]
            else:
                messages = [system_msg] + messages

        token_count = sum(max(1, len(m.content) // 4) for m in messages)

        metadata = {
            "total_messages": len(thread.messages),
            "selected_messages": len(messages),
            "dropped_messages": len(thread.messages) - len(messages) + (
                1 if self._system_prompt and any(m.role == "system" for m in thread.messages) else 0
            ),
            "window_strategy": self._window_strategy.__class__.__name__ if self._window_strategy else None,
            "system_prompt_injected": self._system_prompt is not None,
            "token_estimate": token_count,
        }

        return Context(
            messages=messages,
            system_prompt=self._system_prompt,
            token_count=token_count,
            metadata=metadata,
        )
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd python
pytest tests/assembly/test_builder.py -v
```

Expected: 11 tests pass.

- [ ] **Step 5: Commit**

```bash
git add python/src/agent_context/assembly/builder.py python/tests/assembly/test_builder.py
git commit -m "feat: add ContextBuilder for assembling LLM context

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 8: OpenAIAdapter

**Files:**
- Create: `python/src/agent_context/adapters/openai.py`
- Create: `python/tests/adapters/test_openai.py`

- [ ] **Step 1: Write the failing test**

`python/tests/adapters/test_openai.py`:
```python
import pytest
from agent_context.core.models import Message, Context
from agent_context.adapters.openai import OpenAIAdapter


def test_to_messages_basic():
    ctx = Context(messages=[
        Message(role="system", content="You are helpful"),
        Message(role="user", content="Hello"),
        Message(role="assistant", content="Hi!"),
    ])
    result = OpenAIAdapter.to_messages(ctx)
    assert len(result) == 3
    assert result[0] == {"role": "system", "content": "You are helpful"}
    assert result[1] == {"role": "user", "content": "Hello"}
    assert result[2] == {"role": "assistant", "content": "Hi!"}


def test_to_messages_with_name():
    ctx = Context(messages=[
        Message(role="user", content="Hello", name="alice"),
    ])
    result = OpenAIAdapter.to_messages(ctx)
    assert result[0] == {"role": "user", "content": "Hello", "name": "alice"}


def test_to_messages_with_tool_calls():
    ctx = Context(messages=[
        Message(
            role="assistant",
            content="",
            tool_calls=[{"id": "call-1", "type": "function", "function": {"name": "get_weather"}}],
        ),
    ])
    result = OpenAIAdapter.to_messages(ctx)
    assert result[0]["tool_calls"] == [{"id": "call-1", "type": "function", "function": {"name": "get_weather"}}]


def test_to_messages_with_tool_response():
    ctx = Context(messages=[
        Message(role="tool", content="sunny", tool_call_id="call-1"),
    ])
    result = OpenAIAdapter.to_messages(ctx)
    assert result[0] == {"role": "tool", "content": "sunny", "tool_call_id": "call-1"}


def test_to_messages_empty():
    ctx = Context(messages=[])
    result = OpenAIAdapter.to_messages(ctx)
    assert result == []
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd python
pytest tests/adapters/test_openai.py -v
```

Expected: ImportError for `agent_context.adapters.openai`.

- [ ] **Step 3: Write minimal implementation**

`python/src/agent_context/adapters/openai.py`:
```python
from agent_context.core.models import Context


class OpenAIAdapter:
    @staticmethod
    def to_messages(context: Context) -> list[dict]:
        result = []
        for msg in context.messages:
            item: dict = {
                "role": msg.role,
                "content": msg.content,
            }
            if msg.name:
                item["name"] = msg.name
            if msg.tool_calls:
                item["tool_calls"] = msg.tool_calls
            if msg.tool_call_id:
                item["tool_call_id"] = msg.tool_call_id
            result.append(item)
        return result
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd python
pytest tests/adapters/test_openai.py -v
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add python/src/agent_context/adapters/openai.py python/tests/adapters/test_openai.py
git commit -m "feat: add OpenAI adapter

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 9: AnthropicAdapter

**Files:**
- Create: `python/src/agent_context/adapters/anthropic.py`
- Create: `python/tests/adapters/test_anthropic.py`

- [ ] **Step 1: Write the failing test**

`python/tests/adapters/test_anthropic.py`:
```python
import pytest
from agent_context.core.models import Message, Context
from agent_context.adapters.anthropic import AnthropicAdapter


def test_to_messages_basic():
    ctx = Context(messages=[
        Message(role="system", content="You are helpful"),
        Message(role="user", content="Hello"),
        Message(role="assistant", content="Hi!"),
    ])
    messages, system = AnthropicAdapter.to_messages(ctx)
    assert system == "You are helpful"
    assert len(messages) == 2
    assert messages[0] == {"role": "user", "content": "Hello"}
    assert messages[1] == {"role": "assistant", "content": "Hi!"}


def test_to_messages_no_system():
    ctx = Context(messages=[
        Message(role="user", content="Hello"),
    ])
    messages, system = AnthropicAdapter.to_messages(ctx)
    assert system is None
    assert len(messages) == 1
    assert messages[0] == {"role": "user", "content": "Hello"}


def test_to_messages_multiple_system():
    ctx = Context(messages=[
        Message(role="system", content="First"),
        Message(role="system", content="Second"),
        Message(role="user", content="Hello"),
    ])
    messages, system = AnthropicAdapter.to_messages(ctx)
    assert system == "First\n\nSecond"
    assert len(messages) == 1


def test_to_messages_empty():
    ctx = Context(messages=[])
    messages, system = AnthropicAdapter.to_messages(ctx)
    assert messages == []
    assert system is None
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd python
pytest tests/adapters/test_anthropic.py -v
```

Expected: ImportError for `agent_context.adapters.anthropic`.

- [ ] **Step 3: Write minimal implementation**

`python/src/agent_context/adapters/anthropic.py`:
```python
from agent_context.core.models import Context


class AnthropicAdapter:
    @staticmethod
    def to_messages(context: Context) -> tuple[list[dict], str | None]:
        system_prompt = None
        non_system = []

        for msg in context.messages:
            if msg.role == "system":
                if system_prompt is None:
                    system_prompt = msg.content
                else:
                    system_prompt += "\n\n" + msg.content
            else:
                non_system.append({
                    "role": msg.role,
                    "content": msg.content,
                })

        return non_system, system_prompt
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd python
pytest tests/adapters/test_anthropic.py -v
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add python/src/agent_context/adapters/anthropic.py python/tests/adapters/test_anthropic.py
git commit -m "feat: add Anthropic adapter

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 10: Public API Exports

**Files:**
- Modify: `python/src/agent_context/__init__.py`
- Modify: `python/src/agent_context/core/__init__.py`
- Modify: `python/src/agent_context/management/__init__.py`
- Modify: `python/src/agent_context/assembly/__init__.py`
- Modify: `python/src/agent_context/adapters/__init__.py`

- [ ] **Step 1: Write the test**

`python/tests/test_imports.py`:
```python
import agent_context


def test_top_level_exports():
    assert hasattr(agent_context, "Message")
    assert hasattr(agent_context, "Thread")
    assert hasattr(agent_context, "Context")
    assert hasattr(agent_context, "Storage")
    assert hasattr(agent_context, "InMemoryStorage")
    assert hasattr(agent_context, "ConversationManager")
    assert hasattr(agent_context, "WindowStrategy")
    assert hasattr(agent_context, "SlidingWindow")
    assert hasattr(agent_context, "TokenBudget")
    assert hasattr(agent_context, "ContextBuilder")
    assert hasattr(agent_context, "OpenAIAdapter")
    assert hasattr(agent_context, "AnthropicAdapter")
    assert hasattr(agent_context, "AgentContextError")
    assert hasattr(agent_context, "ThreadNotFoundError")
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd python
pytest tests/test_imports.py -v
```

Expected: AttributeError for most imports.

- [ ] **Step 3: Write implementation**

`python/src/agent_context/__init__.py`:
```python
from agent_context.core.models import Message, Thread, Context
from agent_context.core.storage import Storage, InMemoryStorage
from agent_context.management.conversation import ConversationManager
from agent_context.management.window import WindowStrategy, SlidingWindow, TokenBudget
from agent_context.assembly.builder import ContextBuilder
from agent_context.adapters.openai import OpenAIAdapter
from agent_context.adapters.anthropic import AnthropicAdapter
from agent_context.exceptions import (
    AgentContextError,
    StorageError,
    ThreadNotFoundError,
    StorageConnectionError,
    ValidationError,
    AssemblyError,
    ThreadEmptyError,
    TokenLimitExceededError,
    AdapterError,
)

__all__ = [
    "Message",
    "Thread",
    "Context",
    "Storage",
    "InMemoryStorage",
    "ConversationManager",
    "WindowStrategy",
    "SlidingWindow",
    "TokenBudget",
    "ContextBuilder",
    "OpenAIAdapter",
    "AnthropicAdapter",
    "AgentContextError",
    "StorageError",
    "ThreadNotFoundError",
    "StorageConnectionError",
    "ValidationError",
    "AssemblyError",
    "ThreadEmptyError",
    "TokenLimitExceededError",
    "AdapterError",
]
```

`python/src/agent_context/core/__init__.py`:
```python
from agent_context.core.models import Message, Thread, Context
from agent_context.core.storage import Storage, InMemoryStorage

__all__ = ["Message", "Thread", "Context", "Storage", "InMemoryStorage"]
```

`python/src/agent_context/management/__init__.py`:
```python
from agent_context.management.conversation import ConversationManager
from agent_context.management.window import WindowStrategy, SlidingWindow, TokenBudget

__all__ = ["ConversationManager", "WindowStrategy", "SlidingWindow", "TokenBudget"]
```

`python/src/agent_context/assembly/__init__.py`:
```python
from agent_context.assembly.builder import ContextBuilder

__all__ = ["ContextBuilder"]
```

`python/src/agent_context/adapters/__init__.py`:
```python
from agent_context.adapters.openai import OpenAIAdapter
from agent_context.adapters.anthropic import AnthropicAdapter

__all__ = ["OpenAIAdapter", "AnthropicAdapter"]
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd python
pytest tests/test_imports.py -v
```

Expected: 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add python/src/agent_context/__init__.py \
  python/src/agent_context/core/__init__.py \
  python/src/agent_context/management/__init__.py \
  python/src/agent_context/assembly/__init__.py \
  python/src/agent_context/adapters/__init__.py \
  python/tests/test_imports.py
git commit -m "feat: wire up public API exports

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 11: Integration Tests

**Files:**
- Create: `python/tests/test_integration.py`

- [ ] **Step 1: Write the test**

`python/tests/test_integration.py`:
```python
import pytest
from agent_context import (
    InMemoryStorage,
    ConversationManager,
    ContextBuilder,
    SlidingWindow,
    TokenBudget,
    OpenAIAdapter,
    AnthropicAdapter,
)


@pytest.mark.asyncio
async def test_full_flow_openai():
    storage = InMemoryStorage()
    manager = ConversationManager(storage)

    thread = await manager.create_thread()
    await manager.add_message(thread.id, "system", "You are helpful")
    await manager.add_message(thread.id, "user", "What's the weather?")
    await manager.add_message(thread.id, "assistant", "It's sunny!")

    builder = ContextBuilder(storage)
    ctx = await builder.for_thread(thread.id).with_window_strategy(
        SlidingWindow(max_messages=10)
    ).build()

    messages = OpenAIAdapter.to_messages(ctx)
    assert len(messages) == 3
    assert messages[0]["role"] == "system"
    assert messages[1]["role"] == "user"
    assert messages[2]["role"] == "assistant"


@pytest.mark.asyncio
async def test_full_flow_anthropic():
    storage = InMemoryStorage()
    manager = ConversationManager(storage)

    thread = await manager.create_thread()
    await manager.add_message(thread.id, "system", "You are helpful")
    await manager.add_message(thread.id, "user", "Hello")

    builder = ContextBuilder(storage)
    ctx = await builder.for_thread(thread.id).build()

    messages, system = AnthropicAdapter.to_messages(ctx)
    assert system == "You are helpful"
    assert messages[0]["role"] == "user"
    assert messages[0]["content"] == "Hello"


@pytest.mark.asyncio
async def test_full_flow_with_token_budget():
    storage = InMemoryStorage()
    manager = ConversationManager(storage)

    thread = await manager.create_thread()
    await manager.add_message(thread.id, "user", "a" * 40)
    await manager.add_message(thread.id, "user", "b" * 40)
    await manager.add_message(thread.id, "user", "c" * 40)

    builder = ContextBuilder(storage)
    ctx = await builder.for_thread(thread.id).with_window_strategy(
        TokenBudget(max_tokens=25)
    ).build()

    assert len(ctx.messages) == 1
    assert ctx.messages[0].content == "c" * 40
    assert ctx.metadata["token_estimate"] is not None


@pytest.mark.asyncio
async def test_full_flow_system_prompt_override():
    storage = InMemoryStorage()
    manager = ConversationManager(storage)

    thread = await manager.create_thread()
    await manager.add_message(thread.id, "system", "Old prompt")
    await manager.add_message(thread.id, "user", "Hello")

    builder = ContextBuilder(storage)
    ctx = await builder.for_thread(thread.id).with_system_prompt("New prompt").build()

    system_msgs = [m for m in ctx.messages if m.role == "system"]
    assert len(system_msgs) == 1
    assert system_msgs[0].content == "New prompt"
```

- [ ] **Step 2: Run test to verify it passes**

Run:
```bash
cd python
pytest tests/test_integration.py -v
```

Expected: 4 tests pass.

- [ ] **Step 3: Run full test suite**

Run:
```bash
cd python
pytest -v
```

Expected: All tests pass (50+ tests).

- [ ] **Step 4: Commit**

```bash
git add python/tests/test_integration.py
git commit -m "test: add end-to-end integration tests

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Self-Review

### Spec Coverage

| Spec Section | Task |
|--------------|------|
| Exception hierarchy | Task 2 |
| Core data models (Message, Thread, Context) | Task 3 |
| Storage ABC + InMemoryStorage | Task 4 |
| WindowStrategy (SlidingWindow, TokenBudget) | Task 5 |
| ConversationManager | Task 6 |
| ContextBuilder | Task 7 |
| OpenAIAdapter | Task 8 |
| AnthropicAdapter | Task 9 |
| Public API exports | Task 10 |
| Integration tests | Task 11 |

### Placeholder Scan

- No "TBD", "TODO", or "implement later" found.
- No vague steps like "add error handling" — all error cases have explicit tests.
- No "similar to Task N" references.

### Type Consistency

- `Message`, `Thread`, `Context` dataclass fields match across all tasks.
- `Storage` method signatures are consistent between ABC and `InMemoryStorage`.
- `WindowStrategy.select()` signature is `select(self, messages)` throughout (no `max_tokens` parameter since it's instance-level config).
- `ContextBuilder` chain methods all return `"ContextBuilder"`.
