import type { Message, User } from "@ocha/types";
import { MessageList } from "./MessageList";

interface ThreadDetailProps {
  user: User;
  historicalMessages: Message[];
  currentMessages: Message[];
  isLoadingHistory: boolean;
  currentThreadId: string | null;
  input: string;
  isOwner: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: (message: { text: string }) => void;
  onSignOut: () => void;
}

export function ThreadDetail({
  user,
  historicalMessages,
  currentMessages,
  isLoadingHistory,
  currentThreadId,
  input,
  isOwner,
  onInputChange,
  onSendMessage,
  onSignOut,
}: ThreadDetailProps) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ margin: 0 }}>Ocha</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user.picture && (
            <img
              src={user.picture}
              alt="Profile"
              style={{ width: 32, height: 32, borderRadius: "50%" }}
            />
          )}
          <span>Welcome, {user.name}!</span>
          <button
            type="button"
            onClick={onSignOut}
            style={{
              padding: "8px 16px",
              borderRadius: 4,
              border: "1px solid #ddd",
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Chat Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <MessageList
          historicalMessages={historicalMessages}
          currentMessages={currentMessages}
          isLoadingHistory={isLoadingHistory}
          currentThreadId={currentThreadId}
          input={input}
          isOwner={isOwner}
          onInputChange={onInputChange}
          onSendMessage={onSendMessage}
        />
      </div>
    </div>
  );
}
