from __future__ import annotations

from abc import ABC, abstractmethod

from agent_context.core.models import Message


class WindowStrategy(ABC):
    """Abstract base class for message windowing strategies."""

    @abstractmethod
    def select(self, messages: list[Message]) -> list[Message]:
        """Select a subset of messages to include in the context window."""


class SlidingWindow(WindowStrategy):
    """Returns the last N messages."""

    def __init__(self, max_messages: int) -> None:
        self.max_messages = max_messages

    def select(self, messages: list[Message]) -> list[Message]:
        if self.max_messages <= 0:
            return []
        return messages[-self.max_messages :]


class TokenBudget(WindowStrategy):
    """Accumulates messages from newest backward up to a token budget.

    Preserves system messages by always including them and counting them
    against the budget.
    """

    def __init__(self, max_tokens: int, tokenizer=None) -> None:
        self.max_tokens = max_tokens
        self.tokenizer = tokenizer

    def _count_tokens(self, text: str) -> int:
        if self.tokenizer is not None:
            return self.tokenizer.count(text)
        return max(1, len(text) // 4)

    def select(self, messages: list[Message]) -> list[Message]:
        if not messages:
            return []

        # Separate system and non-system messages
        system_messages = [m for m in messages if m.role == "system"]
        non_system = [m for m in messages if m.role != "system"]

        # System messages are preserved unconditionally and do not count
        # against the token budget.
        remaining = self.max_tokens

        # Accumulate non-system messages from newest backward
        selected_non_system: list[Message] = []
        for msg in reversed(non_system):
            cost = self._count_tokens(msg.content)
            if cost > remaining:
                break
            remaining -= cost
            selected_non_system.insert(0, msg)

        return system_messages + selected_non_system
