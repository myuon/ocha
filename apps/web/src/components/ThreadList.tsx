interface Thread {
  id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

interface ThreadListProps {
  threads: Thread[];
  currentThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
}

export function ThreadList({
  threads,
  currentThreadId,
  onThreadSelect,
  onNewThread,
}: ThreadListProps) {
  return (
    <div
      style={{
        width: 300,
        backgroundColor: "#f5f5f5",
        borderRight: "1px solid #ddd",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Sidebar Header */}
      <div style={{ padding: 16, borderBottom: "1px solid #ddd" }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>Threads</h3>
        <button
          onClick={onNewThread}
          style={{
            marginTop: 8,
            padding: "8px 16px",
            borderRadius: 4,
            border: "1px solid #ddd",
            backgroundColor: "white",
            cursor: "pointer",
            fontSize: 14,
            width: "100%",
          }}
        >
          + New Thread
        </button>
      </div>

      {/* Thread List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {threads.map((thread) => (
          <div
            key={thread.id}
            onClick={() => onThreadSelect(thread.id)}
            style={{
              padding: 12,
              borderBottom: "1px solid #e0e0e0",
              cursor: "pointer",
              backgroundColor:
                currentThreadId === thread.id ? "#e3f2fd" : "transparent",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (currentThreadId !== thread.id) {
                e.currentTarget.style.backgroundColor = "#f0f0f0";
              }
            }}
            onMouseLeave={(e) => {
              if (currentThreadId !== thread.id) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <div style={{ fontSize: 14, fontWeight: "medium" }}>
              {thread.title || `Thread ${thread.id.slice(0, 8)}...`}
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              {new Date(thread.updated_at).toLocaleDateString()}
            </div>
          </div>
        ))}
        {threads.length === 0 && (
          <div style={{ padding: 16, textAlign: "center", color: "#666" }}>
            No threads yet. Start a conversation!
          </div>
        )}
      </div>
    </div>
  );
}