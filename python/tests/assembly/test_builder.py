import pytest
from agent_context.assembly.builder import ContextBuilder
from agent_context.core.storage import InMemoryStorage
from agent_context.core.models import Message
from agent_context.management.window import SlidingWindow, TokenBudget
from agent_context.exceptions import ThreadNotFoundError, AssemblyError


@pytest.fixture
def builder():
    storage = InMemoryStorage()
    return ContextBuilder(storage)


@pytest.mark.asyncio
async def test_build_basic(builder):
    thread = await builder.storage.create_thread()
    await builder.storage.save_message(thread.id, Message(role="user", content="Hello"))
    ctx = await builder.for_thread(thread.id).build()
    assert len(ctx.messages) == 1
    assert ctx.messages[0].content == "Hello"


@pytest.mark.asyncio
async def test_build_with_system_prompt(builder):
    thread = await builder.storage.create_thread()
    await builder.storage.save_message(thread.id, Message(role="user", content="Hello"))
    ctx = await builder.for_thread(thread.id).with_system_prompt("You are helpful").build()
    assert len(ctx.messages) == 2
    assert ctx.messages[0].role == "system"
    assert ctx.messages[0].content == "You are helpful"
    assert ctx.messages[1].content == "Hello"


@pytest.mark.asyncio
async def test_build_with_sliding_window(builder):
    thread = await builder.storage.create_thread()
    for i in range(5):
        await builder.storage.save_message(thread.id, Message(role="user", content=f"msg-{i}"))
    ctx = await builder.for_thread(thread.id).with_window_strategy(SlidingWindow(max_messages=2)).build()
    assert len(ctx.messages) == 2
    assert ctx.messages[0].content == "msg-3"
    assert ctx.messages[1].content == "msg-4"


@pytest.mark.asyncio
async def test_build_with_token_budget(builder):
    thread = await builder.storage.create_thread()
    for i in range(3):
        await builder.storage.save_message(thread.id, Message(role="user", content="a" * 40))
    ctx = await builder.for_thread(thread.id).with_window_strategy(TokenBudget(max_tokens=20)).build()
    assert len(ctx.messages) == 2


@pytest.mark.asyncio
async def test_build_preserves_system_injected(builder):
    thread = await builder.storage.create_thread()
    await builder.storage.save_message(thread.id, Message(role="system", content="Original"))
    await builder.storage.save_message(thread.id, Message(role="user", content="Hello"))
    ctx = await builder.for_thread(thread.id).with_system_prompt("New system").build()
    system_msgs = [m for m in ctx.messages if m.role == "system"]
    assert len(system_msgs) == 1
    assert system_msgs[0].content == "New system"


@pytest.mark.asyncio
async def test_build_no_preserve_system(builder):
    thread = await builder.storage.create_thread()
    await builder.storage.save_message(thread.id, Message(role="system", content="Original"))
    await builder.storage.save_message(thread.id, Message(role="user", content="Hello"))
    ctx = await builder.for_thread(thread.id).with_system_prompt("New").preserve_system(False).build()
    system_msgs = [m for m in ctx.messages if m.role == "system"]
    assert len(system_msgs) == 1
    assert system_msgs[0].content == "New"


@pytest.mark.asyncio
async def test_build_with_recent_messages(builder):
    thread = await builder.storage.create_thread()
    for i in range(5):
        await builder.storage.save_message(thread.id, Message(role="user", content=f"msg-{i}"))
    ctx = await builder.for_thread(thread.id).with_window_strategy(SlidingWindow(max_messages=2)).with_recent_messages(4).build()
    assert len(ctx.messages) == 4
    assert ctx.messages[0].content == "msg-1"


@pytest.mark.asyncio
async def test_build_metadata(builder):
    thread = await builder.storage.create_thread()
    for i in range(5):
        await builder.storage.save_message(thread.id, Message(role="user", content=f"msg-{i}"))
    ctx = await builder.for_thread(thread.id).with_window_strategy(SlidingWindow(max_messages=2)).build()
    assert ctx.metadata["total_messages"] == 5
    assert ctx.metadata["selected_messages"] == 2
    assert ctx.metadata["dropped_messages"] == 3
    assert ctx.metadata["window_strategy"] == "SlidingWindow"
    assert ctx.metadata["system_prompt_injected"] is False
    assert ctx.metadata["token_estimate"] is not None


@pytest.mark.asyncio
async def test_build_thread_not_found(builder):
    with pytest.raises(ThreadNotFoundError):
        await builder.for_thread("nonexistent").build()


@pytest.mark.asyncio
async def test_build_no_thread_set(builder):
    with pytest.raises(AssemblyError, match="Thread ID not set"):
        await builder.build()


@pytest.mark.asyncio
async def test_build_chaining_returns_same_instance(builder):
    b1 = builder.for_thread("t1")
    b2 = b1.with_system_prompt("test")
    assert b1 is b2
