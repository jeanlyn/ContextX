from __future__ import annotations

from agent_context.core.models import Context


class OpenAIAdapter:
    """Adapter for converting Context to OpenAI-compatible message format."""

    @staticmethod
    def to_messages(context: Context) -> list[dict]:
        """Convert a Context to a list of OpenAI-compatible message dicts."""
        result = []
        for msg in context.messages:
            d = {
                "role": msg.role,
                "content": msg.content,
            }
            if msg.name is not None:
                d["name"] = msg.name
            if msg.tool_calls is not None:
                d["tool_calls"] = msg.tool_calls
            if msg.tool_call_id is not None:
                d["tool_call_id"] = msg.tool_call_id
            result.append(d)
        return result
