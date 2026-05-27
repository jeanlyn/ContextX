from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from datetime import UTC, datetime

from agent_context.core.models import Message, Thread
from agent_context.exceptions import ThreadNotFoundError


class Storage(ABC):
    """Abstract base class for thread storage backends."""

    @abstractmethod
    async def create_thread(self, metadata: dict | None = None) -> Thread:
        """Create a new thread."""

    @abstractmethod
    async def get_thread(self, thread_id: str) -> Thread | None:
        """Retrieve a thread by ID, or None if not found."""

    @abstractmethod
    async def save_message(self, thread_id: str, message: Message) -> None:
        """Append a message to a thread."""

    @abstractmethod
    async def delete_thread(self, thread_id: str) -> None:
        """Delete a thread by ID."""

    @abstractmethod
    async def list_threads(self, limit: int = 100, offset: int = 0) -> list[Thread]:
        """List threads with pagination."""


class InMemoryStorage(Storage):
    """In-memory implementation of the Storage interface."""

    def __init__(self) -> None:
        self._threads: dict[str, Thread] = {}

    async def create_thread(self, metadata: dict | None = None) -> Thread:
        thread_id = str(uuid.uuid4())
        thread = Thread(id=thread_id, metadata=metadata or {})
        self._threads[thread_id] = thread
        return thread

    async def get_thread(self, thread_id: str) -> Thread | None:
        return self._threads.get(thread_id)

    async def save_message(self, thread_id: str, message: Message) -> None:
        thread = self._threads.get(thread_id)
        if thread is None:
            raise ThreadNotFoundError(thread_id)
        thread.messages.append(message)
        thread.updated_at = datetime.now(UTC)

    async def delete_thread(self, thread_id: str) -> None:
        if thread_id not in self._threads:
            raise ThreadNotFoundError(thread_id)
        del self._threads[thread_id]

    async def list_threads(self, limit: int = 100, offset: int = 0) -> list[Thread]:
        all_threads = list(self._threads.values())
        return all_threads[offset : offset + limit]
