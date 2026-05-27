import pytest
from agent_context.exceptions import (
    AgentContextError,
    StorageError,
    ThreadNotFoundError,
    StorageConnectionError,
    ValidationError,
    AssemblyError,
    ThreadEmptyError,
    TokenLimitExceededError,
    AdapterError,
)


def test_exception_hierarchy():
    assert issubclass(StorageError, AgentContextError)
    assert issubclass(ThreadNotFoundError, StorageError)
    assert issubclass(StorageConnectionError, StorageError)
    assert issubclass(ValidationError, AgentContextError)
    assert issubclass(AssemblyError, AgentContextError)
    assert issubclass(ThreadEmptyError, AssemblyError)
    assert issubclass(TokenLimitExceededError, AssemblyError)
    assert issubclass(AdapterError, AgentContextError)


def test_thread_not_found_error_message():
    err = ThreadNotFoundError("thread-123")
    assert "thread-123" in str(err)
    assert err.thread_id == "thread-123"


def test_thread_empty_error_message():
    err = ThreadEmptyError("thread-456")
    assert "thread-456" in str(err)
    assert err.thread_id == "thread-456"
