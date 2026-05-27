import { Message, Context } from '../core/models.js';

export interface AnthropicMessage {
  role: string;
  content: string;
}

export class AnthropicAdapter {
  static toMessages(context: Context): [AnthropicMessage[], string | null] {
    const systemMessages: string[] = [];
    const anthropicMessages: AnthropicMessage[] = [];

    for (const msg of context.messages) {
      if (msg.role === 'system') {
        systemMessages.push(msg.content);
      } else {
        anthropicMessages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    const system = systemMessages.length > 0 ? systemMessages.join('\n\n') : null;
    return [anthropicMessages, system];
  }
}
