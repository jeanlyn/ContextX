import pytest
from agent_context.core.storage import InMemoryStorage
from agent_context.core.models import Message
from agent_context.exceptions import ThreadNotFoundError


@pytest.fixture
def storage():
    return InMemoryStorage()


@pytest.mark.asyncio
async def test_create_thread(storage):
    thread = await storage.create_thread()
    assert thread.id is not None
    assert isinstance(thread.id, str)
    assert thread.messages == []
    assert thread.metadata == {}


@pytest.mark.asyncio
async def test_create_thread_with_metadata(storage):
    thread = await storage.create_thread(metadata={"key": "value"})
    assert thread.metadata == {"key": "value"}


@pytest.mark.asyncio
async def test_save_message(storage):
    thread = await storage.create_thread()
    msg = Message(role="user", content="Hello")
    await storage.save_message(thread.id, msg)
    retrieved = await storage.get_thread(thread.id)
    assert len(retrieved.messages) == 1
    assert retrieved.messages[0].content == "Hello"
    assert retrieved.updated_at > retrieved.created_at


@pytest.mark.asyncio
async def test_get_thread_not_found(storage):
    result = await storage.get_thread("nonexistent")
    assert result is None


@pytest.mark.asyncio
async def test_delete_thread(storage):
    thread = await storage.create_thread()
    await storage.delete_thread(thread.id)
    assert await storage.get_thread(thread.id) is None


@pytest.mark.asyncio
async def test_delete_thread_not_found(storage):
    with pytest.raises(ThreadNotFoundError) as exc_info:
        await storage.delete_thread("nonexistent")
    assert "nonexistent" in str(exc_info.value)


@pytest.mark.asyncio
async def test_save_message_thread_not_found(storage):
    msg = Message(role="user", content="Hello")
    with pytest.raises(ThreadNotFoundError):
        await storage.save_message("nonexistent", msg)


@pytest.mark.asyncio
async def test_list_threads(storage):
    t1 = await storage.create_thread()
    t2 = await storage.create_thread()
    threads = await storage.list_threads()
    assert len(threads) == 2


@pytest.mark.asyncio
async def test_list_threads_pagination(storage):
    for _ in range(5):
        await storage.create_thread()
    threads = await storage.list_threads(limit=2, offset=1)
    assert len(threads) == 2
