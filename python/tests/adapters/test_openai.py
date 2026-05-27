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
    ctx = Context(messages=[Message(role="user", content="Hello", name="alice")])
    result = OpenAIAdapter.to_messages(ctx)
    assert result[0] == {"role": "user", "content": "Hello", "name": "alice"}


def test_to_messages_with_tool_calls():
    ctx = Context(messages=[Message(role="assistant", content="", tool_calls=[{"id": "call-1", "type": "function", "function": {"name": "get_weather"}}])])
    result = OpenAIAdapter.to_messages(ctx)
    assert result[0]["tool_calls"] == [{"id": "call-1", "type": "function", "function": {"name": "get_weather"}}]


def test_to_messages_with_tool_response():
    ctx = Context(messages=[Message(role="tool", content="sunny", tool_call_id="call-1")])
    result = OpenAIAdapter.to_messages(ctx)
    assert result[0] == {"role": "tool", "content": "sunny", "tool_call_id": "call-1"}


def test_to_messages_empty():
    ctx = Context(messages=[])
    result = OpenAIAdapter.to_messages(ctx)
    assert result == []
