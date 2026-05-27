from __future__ import annotations

from agent_context.core.models import Context


class AnthropicAdapter:
    """Adapter for converting Context to Anthropic-compatible message format."""

    @staticmethod
    def to_messages(context: Context) -> tuple[list[dict], str | None]:
        """Convert a Context to Anthropic-compatible (messages, system) format.

        Extracts system messages into a single string and returns non-system
        messages as simple {role, content} dicts.
        """
        system_parts = []
        messages = []

        for msg in context.messages:
            if msg.role == "system":
                system_parts.append(msg.content)
            else:
                messages.append({
                    "role": msg.role,
                    "content": msg.content,
                })

        system = "\n\n".join(system_parts) if system_parts else None
        return messages, system
