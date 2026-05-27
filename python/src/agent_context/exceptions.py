class AgentContextError(Exception):
    """Base exception for all agent-context errors."""


class StorageError(AgentContextError):
    """Raised when a storage operation fails."""


class ThreadNotFoundError(StorageError):
    """Raised when a requested thread does not exist."""

    def __init__(self, thread_id: str):
        self.thread_id = thread_id
        super().__init__(f"Thread not found: {thread_id}")


class StorageConnectionError(StorageError):
    """Raised when the storage backend cannot be reached."""


class ValidationError(AgentContextError):
    """Raised when input validation fails."""


class AssemblyError(AgentContextError):
    """Raised when context assembly fails."""


class ThreadEmptyError(AssemblyError):
    """Raised when a thread has no messages."""

    def __init__(self, thread_id: str):
        self.thread_id = thread_id
        super().__init__(f"Thread is empty: {thread_id}")


class TokenLimitExceededError(AssemblyError):
    """Raised when the token limit is exceeded."""


class AdapterError(AgentContextError):
    """Raised when an adapter operation fails."""
