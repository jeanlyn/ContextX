from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class Message:
    role: str
    content: str
    name: str | None = None
    tool_calls: list[dict[str, Any]] | None = None
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
