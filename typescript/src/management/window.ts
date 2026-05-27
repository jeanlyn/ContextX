import { Message } from '../core/models.js';

export interface Tokenizer {
  count(text: string): number;
}

export interface WindowStrategy {
  select(messages: Message[]): Message[];
}

export class SlidingWindow implements WindowStrategy {
  constructor(private maxMessages: number) {}

  select(messages: Message[]): Message[] {
    if (this.maxMessages <= 0) {
      return [];
    }
    return messages.slice(-this.maxMessages);
  }
}

export class TokenBudget implements WindowStrategy {
  constructor(
    private budget: number,
    private tokenizer?: Tokenizer,
  ) {}

  private countTokens(text: string): number {
    if (this.tokenizer) {
      return this.tokenizer.count(text);
    }
    return Math.max(1, Math.floor(text.length / 4));
  }

  select(messages: Message[]): Message[] {
    if (messages.length === 0) {
      return [];
    }

    const systemMessages: Message[] = [];
    const nonSystemMessages: Message[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemMessages.push(msg);
      } else {
        nonSystemMessages.push(msg);
      }
    }

    let usedBudget = 0;

    const result: Message[] = [...systemMessages];

    const selectedNonSystem: Message[] = [];
    for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
      const msg = nonSystemMessages[i];
      const cost = this.countTokens(msg.content);
      if (usedBudget + cost <= this.budget) {
        selectedNonSystem.unshift(msg);
        usedBudget += cost;
      } else {
        break;
      }
    }

    result.push(...selectedNonSystem);
    return result;
  }
}
