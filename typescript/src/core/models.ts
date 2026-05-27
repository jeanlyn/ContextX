export interface MessageOptions {
  name?: string;
  toolCalls?: Array<{ id: string }>;
  toolCallId?: string;
  metadata?: Record<string, unknown>;
}

export class Message {
  role: string;
  content: string;
  name?: string;
  toolCalls?: Array<{ id: string }>;
  toolCallId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;

  constructor(role: string, content: string, options?: MessageOptions) {
    this.role = role;
    this.content = content;
    this.name = options?.name;
    this.toolCalls = options?.toolCalls;
    this.toolCallId = options?.toolCallId;
    this.metadata = options?.metadata;
    this.createdAt = new Date();
  }
}

export interface ThreadOptions {
  metadata?: Record<string, unknown>;
}

export class Thread {
  id: string;
  messages: Message[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;

  constructor(id: string, options?: ThreadOptions) {
    this.id = id;
    this.messages = [];
    this.metadata = options?.metadata ?? {};
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

export interface ContextOptions {
  systemPrompt?: string;
  tokenCount?: number;
  metadata?: Record<string, unknown>;
}

export class Context {
  messages: Message[];
  systemPrompt?: string;
  tokenCount?: number;
  metadata: Record<string, unknown>;

  constructor(messages: Message[], options?: ContextOptions) {
    this.messages = messages;
    this.systemPrompt = options?.systemPrompt;
    this.tokenCount = options?.tokenCount;
    this.metadata = options?.metadata ?? {};
  }
}
