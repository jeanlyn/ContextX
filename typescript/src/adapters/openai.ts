import { Message, Context } from '../core/models.js';

export interface OpenAIMessage {
  role: string;
  content: string;
  name?: string;
  tool_calls?: Array<Record<string, unknown>>;
  tool_call_id?: string;
}

export class OpenAIAdapter {
  static toMessages(context: Context): OpenAIMessage[] {
    return context.messages.map((msg: Message) => {
      const result: OpenAIMessage = {
        role: msg.role,
        content: msg.content,
      };

      if (msg.name !== undefined) {
        result.name = msg.name;
      }

      if (msg.toolCalls !== undefined) {
        result.tool_calls = msg.toolCalls;
      }

      if (msg.toolCallId !== undefined) {
        result.tool_call_id = msg.toolCallId;
      }

      return result;
    });
  }
}
