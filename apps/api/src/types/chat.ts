export interface UserLocation {
  type: "approximate";
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  city?: string;
  region?: string;
}

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
  userLocation?: UserLocation;
}
