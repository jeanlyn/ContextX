import pytest

from agent_context import (
    AnthropicAdapter,
    ContextBuilder,
    ConversationManager,
    InMemoryStorage,
    OpenAIAdapter,
    SlidingWindow,
    TokenBudget,
)


@pytest.mark.asyncio
async def test_full_flow_openai():
    storage = InMemoryStorage()
    manager = ConversationManager(storage)
    thread = await manager.create_thread()
    await manager.add_message(thread.id, "system", "You are helpful")
    await manager.add_message(thread.id, "user", "What's the weather?")
    await manager.add_message(thread.id, "assistant", "It's sunny!")
    builder = ContextBuilder(storage)
    ctx = (
        await builder.for_thread(thread.id)
        .with_window_strategy(SlidingWindow(max_messages=10))
        .build()
    )
    messages = OpenAIAdapter.to_messages(ctx)
    assert len(messages) == 3
    assert messages[0]["role"] == "system"
    assert messages[1]["role"] == "user"
    assert messages[2]["role"] == "assistant"


@pytest.mark.asyncio
async def test_full_flow_anthropic():
    storage = InMemoryStorage()
    manager = ConversationManager(storage)
    thread = await manager.create_thread()
    await manager.add_message(thread.id, "system", "You are helpful")
    await manager.add_message(thread.id, "user", "Hello")
    builder = ContextBuilder(storage)
    ctx = await builder.for_thread(thread.id).build()
    messages, system = AnthropicAdapter.to_messages(ctx)
    assert system == "You are helpful"
    assert messages[0]["role"] == "user"
    assert messages[0]["content"] == "Hello"


@pytest.mark.asyncio
async def test_full_flow_with_token_budget():
    storage = InMemoryStorage()
    manager = ConversationManager(storage)
    thread = await manager.create_thread()
    await manager.add_message(thread.id, "user", "a" * 40)
    await manager.add_message(thread.id, "user", "b" * 40)
    await manager.add_message(thread.id, "user", "c" * 40)
    builder = ContextBuilder(storage)
    ctx = (
        await builder.for_thread(thread.id)
        .with_window_strategy(TokenBudget(max_tokens=15))
        .build()
    )
    assert len(ctx.messages) == 1
    assert ctx.messages[0].content == "c" * 40
    assert ctx.metadata["token_estimate"] is not None


@pytest.mark.asyncio
async def test_full_flow_system_prompt_override():
    storage = InMemoryStorage()
    manager = ConversationManager(storage)
    thread = await manager.create_thread()
    await manager.add_message(thread.id, "system", "Old prompt")
    await manager.add_message(thread.id, "user", "Hello")
    builder = ContextBuilder(storage)
    ctx = await builder.for_thread(thread.id).with_system_prompt("New prompt").build()
    system_msgs = [m for m in ctx.messages if m.role == "system"]
    assert len(system_msgs) == 1
    assert system_msgs[0].content == "New prompt"
