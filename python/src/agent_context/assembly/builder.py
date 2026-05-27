from __future__ import annotations

from agent_context.core.models import Context, Message
from agent_context.core.storage import Storage
from agent_context.management.conversation import ConversationManager
from agent_context.management.window import WindowStrategy
from agent_context.exceptions import AssemblyError, ThreadNotFoundError


class ContextBuilder:
    """Fluent builder for assembling context from a conversation thread."""

    def __init__(self, storage: Storage, manager: ConversationManager | None = None) -> None:
        self.storage = storage
        self.manager = manager or ConversationManager(storage)
        self._thread_id: str | None = None
        self._system_prompt: str | None = None
        self._window_strategy: WindowStrategy | None = None
        self._recent_messages: int | None = None
        self._preserve_system: bool = True

    def for_thread(self, thread_id: str) -> ContextBuilder:
        """Set the thread ID to build context from."""
        self._thread_id = thread_id
        return self

    def with_system_prompt(self, prompt: str) -> ContextBuilder:
        """Set a system prompt to inject into the context."""
        self._system_prompt = prompt
        return self

    def with_window_strategy(self, strategy: WindowStrategy) -> ContextBuilder:
        """Set the window strategy for message selection."""
        self._window_strategy = strategy
        return self

    def with_recent_messages(self, count: int) -> ContextBuilder:
        """Set the number of recent messages to pin."""
        self._recent_messages = count
        return self

    def preserve_system(self, value: bool) -> ContextBuilder:
        """Whether to preserve existing system messages when injecting a new one."""
        self._preserve_system = value
        return self

    async def build(self) -> Context:
        """Build the context from the configured thread."""
        if self._thread_id is None:
            raise AssemblyError("Thread ID not set")

        thread = await self.storage.get_thread(self._thread_id)
        if thread is None:
            raise ThreadNotFoundError(self._thread_id)

        total_messages = len(thread.messages)
        messages = list(thread.messages)

        # Apply window strategy if set
        if self._window_strategy is not None:
            messages = self._window_strategy.select(messages)

        # Pin recent messages: merge with existing selection, sort by original order
        if self._recent_messages is not None:
            recent = thread.messages[-self._recent_messages:]
            # Merge: keep unique messages, preserve original order
            seen = {id(m) for m in messages}
            for msg in recent:
                if id(msg) not in seen:
                    messages.append(msg)
            # Sort by original order from thread
            order = {id(m): i for i, m in enumerate(thread.messages)}
            messages.sort(key=lambda m: order.get(id(m), float('inf')))

        # Inject system prompt
        system_prompt_injected = False
        if self._system_prompt is not None:
            system_msg = Message(role="system", content=self._system_prompt)
            # Replace existing system messages with the new one
            messages = [m for m in messages if m.role != "system"]
            messages.insert(0, system_msg)
            system_prompt_injected = True

        # Calculate token estimate
        token_estimate = sum(max(1, len(m.content) // 4) for m in messages)

        metadata = {
            "total_messages": total_messages,
            "selected_messages": len(messages),
            "dropped_messages": total_messages - len(messages) + (1 if system_prompt_injected else 0),
            "window_strategy": self._window_strategy.__class__.__name__ if self._window_strategy else None,
            "system_prompt_injected": system_prompt_injected,
            "token_estimate": token_estimate,
        }

        return Context(
            messages=messages,
            system_prompt=self._system_prompt,
            token_count=token_estimate,
            metadata=metadata,
        )
