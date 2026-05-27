import pytest
from agent_context.management.conversation import ConversationManager
from agent_context.core.storage import InMemoryStorage
from agent_context.exceptions import ThreadNotFoundError


@pytest.fixture
def manager():
    return ConversationManager(InMemoryStorage())


@pytest.mark.asyncio
async def test_create_thread(manager):
    thread = await manager.create_thread()
    assert thread.id is not None
    assert thread.messages == []


@pytest.mark.asyncio
async def test_create_thread_with_metadata(manager):
    thread = await manager.create_thread(metadata={"key": "value"})
    assert thread.metadata == {"key": "value"}


@pytest.mark.asyncio
async def test_add_message(manager):
    thread = await manager.create_thread()
    msg = await manager.add_message(thread.id, "user", "Hello")
    assert msg.role == "user"
    assert msg.content == "Hello"
    thread = await manager.get_thread(thread.id)
    assert len(thread.messages) == 1


@pytest.mark.asyncio
async def test_add_message_with_kwargs(manager):
    thread = await manager.create_thread()
    msg = await manager.add_message(thread.id, "assistant", "", tool_calls=[{"id": "call-1"}])
    assert msg.tool_calls == [{"id": "call-1"}]


@pytest.mark.asyncio
async def test_get_thread(manager):
    thread = await manager.create_thread()
    retrieved = await manager.get_thread(thread.id)
    assert retrieved.id == thread.id


@pytest.mark.asyncio
async def test_get_thread_not_found(manager):
    result = await manager.get_thread("nonexistent")
    assert result is None


@pytest.mark.asyncio
async def test_delete_thread(manager):
    thread = await manager.create_thread()
    await manager.delete_thread(thread.id)
    assert await manager.get_thread(thread.id) is None


@pytest.mark.asyncio
async def test_delete_thread_not_found(manager):
    with pytest.raises(ThreadNotFoundError):
        await manager.delete_thread("nonexistent")


@pytest.mark.asyncio
async def test_list_messages(manager):
    thread = await manager.create_thread()
    await manager.add_message(thread.id, "user", "Hello")
    await manager.add_message(thread.id, "assistant", "Hi!")
    messages = await manager.list_messages(thread.id)
    assert len(messages) == 2
    assert messages[0].content == "Hello"
    assert messages[1].content == "Hi!"


@pytest.mark.asyncio
async def test_list_messages_thread_not_found(manager):
    with pytest.raises(ThreadNotFoundError):
        await manager.list_messages("nonexistent")
