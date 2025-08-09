import { useState } from "react";

interface ToolPart {
  type: string;
  toolCallId: string;
  state: "call" | "output-available" | "partial" | "error";
  input: Record<string, any>;
  output?: Record<string, any>;
  providerExecuted?: boolean;
}

interface ToolDisplayProps {
  part: ToolPart;
}

export function ToolDisplay({ part }: ToolDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getToolName = (type: string) => {
    if (type.startsWith("tool-")) {
      return type.substring(5).replace(/_/g, " ");
    }
    return type;
  };

  const getStateDisplay = (state: string) => {
    switch (state) {
      case "call":
        return "🔄 Calling";
      case "output-available":
        return "✅ Completed";
      case "partial":
        return "⏳ In Progress";
      case "error":
        return "❌ Error";
      default:
        return state;
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "call":
        return "#ffa726";
      case "output-available":
        return "#66bb6a";
      case "partial":
        return "#42a5f5";
      case "error":
        return "#ef5350";
      default:
        return "#666";
    }
  };

  const hasDetails = Object.keys(part.input).length > 0 || part.output;

  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: 12,
        margin: "8px 0",
        backgroundColor: "#f8f9fa",
        fontSize: "0.9em",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: hasDetails ? "pointer" : "default",
        }}
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {hasDetails && (
            <span
              style={{
                fontSize: "0.8em",
                color: "#666",
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            >
              ▶
            </span>
          )}
          <span
            style={{
              fontWeight: "bold",
              color: "#1976d2",
              textTransform: "capitalize",
            }}
          >
            🔧 {getToolName(part.type)}
          </span>
        </div>
        <span
          style={{
            fontSize: "0.85em",
            color: getStateColor(part.state),
            fontWeight: "500",
          }}
        >
          {getStateDisplay(part.state)}
        </span>
      </div>

      {isExpanded && hasDetails && (
        <div style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid #e0e0e0" }}>
          {Object.keys(part.input).length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: "#666", fontSize: "0.85em" }}>Input:</strong>
              <div
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #e0e0e0",
                  borderRadius: 4,
                  padding: 8,
                  marginTop: 4,
                  fontSize: "0.85em",
                  fontFamily: "monospace",
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {JSON.stringify(part.input, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {part.output && (
            <div>
              <strong style={{ color: "#666", fontSize: "0.85em" }}>Output:</strong>
              <div
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #e0e0e0",
                  borderRadius: 4,
                  padding: 8,
                  marginTop: 4,
                  fontSize: "0.85em",
                  fontFamily: "monospace",
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {JSON.stringify(part.output, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: 8,
              fontSize: "0.75em",
              color: "#999",
            }}
          >
            ID: {part.toolCallId.substring(0, 16)}...
          </div>
        </div>
      )}

      {!hasDetails && (
        <div
          style={{
            marginTop: 8,
            fontSize: "0.75em",
            color: "#999",
          }}
        >
          ID: {part.toolCallId.substring(0, 16)}...
        </div>
      )}
    </div>
  );
}