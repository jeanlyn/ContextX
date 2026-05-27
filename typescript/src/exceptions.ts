export class AgentContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class StorageError extends AgentContextError {
  constructor(message: string) {
    super(message);
  }
}

export class ThreadNotFoundError extends StorageError {
  readonly threadId: string;

  constructor(threadId: string) {
    super(`Thread not found: ${threadId}`);
    this.threadId = threadId;
  }
}

export class StorageConnectionError extends StorageError {
  constructor(message: string) {
    super(message);
  }
}

export class ValidationError extends AgentContextError {
  constructor(message: string) {
    super(message);
  }
}

export class AssemblyError extends AgentContextError {
  constructor(message: string) {
    super(message);
  }
}

export class ThreadEmptyError extends AssemblyError {
  readonly threadId: string;

  constructor(threadId: string) {
    super(`Thread is empty: ${threadId}`);
    this.threadId = threadId;
  }
}

export class TokenLimitExceededError extends AssemblyError {
  constructor(message: string) {
    super(message);
  }
}

export class AdapterError extends AgentContextError {
  constructor(message: string) {
    super(message);
  }
}
