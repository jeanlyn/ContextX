from __future__ import annotations

from agent_context.core.models import Message, Thread
from agent_context.core.storage import Storage
from agent_context.exceptions import ThreadNotFoundError


class ConversationManager:
    """Manages conversation threads and messages."""

    def __init__(self, storage: Storage) -> None:
        self.storage = storage

    async def create_thread(self, metadata: dict | None = None) -> Thread:
        """Create a new thread."""
        return await self.storage.create_thread(metadata)

    async def add_message(
        self,
        thread_id: str,
        role: str,
        content: str,
        **kwargs,
    ) -> Message:
        """Add a message to a thread and return it."""
        message = Message(role=role, content=content, **kwargs)
        await self.storage.save_message(thread_id, message)
        return message

    async def get_thread(self, thread_id: str) -> Thread | None:
        """Get a thread by ID, or None if not found."""
        return await self.storage.get_thread(thread_id)

    async def delete_thread(self, thread_id: str) -> None:
        """Delete a thread by ID."""
        await self.storage.delete_thread(thread_id)

    async def list_messages(self, thread_id: str) -> list[Message]:
        """List all messages in a thread."""
        thread = await self.storage.get_thread(thread_id)
        if thread is None:
            raise ThreadNotFoundError(thread_id)
        return thread.messages
