export interface ChatRequest {
  messages: Array<{
    id?: string;
    role: "user" | "assistant" | "system";
    content?: string;
    parts: Array<{
      type: "text";
      text: string;
    }>;
  }>;
}
