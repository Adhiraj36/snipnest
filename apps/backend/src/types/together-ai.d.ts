declare module 'together-ai' {
  type ChatMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
  };

  type CompletionResponse = {
    choices?: Array<{
      message?: {
        content?: string | Array<{ text?: string }>;
      };
    }>;
  };

  type StreamChunk = {
    choices?: Array<{
      delta?: {
        content?: string;
      };
    }>;
  };

  type CompletionStream = AsyncIterable<StreamChunk>;

  export default class Together {
    constructor(options?: { apiKey?: string; baseURL?: string });
    chat: {
      completions: {
        create(input: {
          model: string;
          temperature?: number;
          messages: ChatMessage[];
          stream: true;
        }): Promise<CompletionStream>;
        create(input: {
          model: string;
          temperature?: number;
          messages: ChatMessage[];
          stream?: false;
        }): Promise<CompletionResponse>;
      };
    };
  }
}
