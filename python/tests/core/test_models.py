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
    msg = Message(role="assistant", content="", name="weather_tool", tool_calls=[{"id": "call-1"}], tool_call_id="call-1", metadata={"key": "value"})
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
    assert len(ctx.messages) == 1
    assert ctx.system_prompt is None
    assert ctx.token_count is None
    assert ctx.metadata == {}


def test_context_with_all_fields():
    msg = Message(role="system", content="Be helpful")
    ctx = Context(messages=[msg], system_prompt="Be helpful", token_count=5, metadata={"source": "test"})
    assert ctx.system_prompt == "Be helpful"
    assert ctx.token_count == 5
    assert ctx.metadata == {"source": "test"}
