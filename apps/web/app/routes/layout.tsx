import type { Thread, User } from "@ocha/types";
import { useState } from "react";
import { useMatch, useRevalidator } from "react-router";
import {
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { GoogleSignIn } from "../../src/components/GoogleSignIn";
import { ThreadList } from "../../src/components/ThreadList";
import { useAuth } from "../../src/hooks/useAuth";
import { client, getAuthHeaders } from "../../src/lib/api";

export async function loader() {
  // Server-side rendering時はlocalStorageが使用できないため、クライアント専用
  if (typeof window === "undefined") {
    return { threads: [] };
  }

  const token = localStorage.getItem("auth_token");

  if (!token) {
    return { threads: [] };
  }

  const response = await client.api.threads.$get(
    {},
    {
      headers: getAuthHeaders(),
    }
  );

  if (response.ok) {
    const threadsData = await response.json();
    return { threads: threadsData.threads };
  }

  console.error("Threads loading error:", await response.text());
  return { threads: [] };
}

export default function Layout() {
  const { threads } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { user, signIn, signOut, setAuthError } = useAuth();

  const { revalidate } = useRevalidator();

  const handleSignIn = async (userData: User) => {
    signIn(userData);
    revalidate();
  };

  const handleSignOut = () => {
    signOut();
    // Navigate to home and reload to clear all data
    navigate("/");
  };

  const handleThreadSelect = (threadId: string) => {
    navigate(`/threads/${threadId}`);
  };

  const handleNewThread = () => {
    navigate("/");
  };

  const matched = useMatch("/threads/:threadId");

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {!user ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              padding: 20,
              borderBottom: "1px solid #ddd",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1 style={{ margin: 0 }}>Ocha</h1>
            <div>
              <GoogleSignIn onSignIn={handleSignIn} onError={setAuthError} />
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2em",
              color: "#666",
            }}
          >
            Please sign in to continue
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            height: "100%",
          }}
        >
          <ThreadList
            threads={threads}
            currentThreadId={matched?.params.threadId}
            onThreadSelect={handleThreadSelect}
            onNewThread={handleNewThread}
          />
          <div
            style={{
              height: "100%",
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header - Fixed */}
            <div
              style={{
                padding: "12px 18px",
                backgroundColor: "rgba(255, 255, 255, 0.6)",
                borderBottom: "1px solid white",
                backdropFilter: "blur(10px)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
                position: "sticky",
                top: 0,
              }}
            >
              <h1 style={{ margin: 0, fontSize: "24px" }}>Ocha</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: "0.9em", color: "#666" }}>
                  {user.name} ({user.email})
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 4,
                    border: "1px solid #ddd",
                    backgroundColor: "white",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
            {/* Main Content Area */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
              }}
            >
              <Outlet />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
