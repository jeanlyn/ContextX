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
    ctx = Context(messages=[Message(role="user", content="Hello")])
    messages, system = AnthropicAdapter.to_messages(ctx)
    assert system is None
    assert len(messages) == 1


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
