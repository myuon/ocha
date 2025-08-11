import type { Thread, User } from "@ocha/types";
import { useState } from "react";
import {
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { GoogleSignIn } from "../../src/components/GoogleSignIn";
import { ThreadList } from "../../src/components/ThreadList";
import { useAuth } from "../../src/hooks/useAuth";
import { useRevalidator } from "react-router";

export async function loader() {
  // Server-side rendering時はlocalStorageが使用できないため、クライアント専用
  if (typeof window === "undefined") {
    return { user: null, threads: [] };
  }

  const token = localStorage.getItem("auth_token");

  if (!token) {
    return { user: null, threads: [] };
  }

  try {
    // Verify token
    const authResponse = await fetch("/api/auth/verify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!authResponse.ok) {
      localStorage.removeItem("auth_token");
      return { user: null, threads: [] };
    }

    const authData = await authResponse.json();

    // Fetch threads
    const threadsResponse = await fetch("/api/threads", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let threads: Thread[] = [];
    if (threadsResponse.ok) {
      const threadsData = await threadsResponse.json();
      threads = threadsData.threads;
    }

    return { user: authData.user, threads };
  } catch (error) {
    console.error("Auth/threads loading error:", error);
    localStorage.removeItem("auth_token");
    return { user: null, threads: [] };
  }
}

export default function Layout() {
  const initialData = useLoaderData<typeof loader>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signIn, signOut, setAuthError } = useAuth();

  // Use loader data as initial state, but let useAuth manage auth state
  const currentUser = user || initialData.user;
  const threads = initialData.threads; // loader data for initial threads

  const [currentThreadId, setCurrentThreadId] = useState<string | null>(() => {
    // Extract thread ID from URL path
    const match = location.pathname.match(/^\/threads\/(.+)$/);
    return match ? match[1] : null;
  });

  const { revalidate } = useRevalidator();

  const handleSignIn = async (userData: User) => {
    signIn(userData);
    revalidate();
  };

  const handleSignOut = () => {
    signOut();
    setCurrentThreadId(null);
    // Navigate to home and reload to clear all data
    navigate("/");
  };

  const handleAuthError = (error: string) => {
    setAuthError(error);
  };

  const handleThreadSelect = (threadId: string) => {
    setCurrentThreadId(threadId);
    navigate(`/threads/${threadId}`);
  };

  const handleNewThread = () => {
    setCurrentThreadId(null);
    navigate("/");
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {!currentUser ? (
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
              <GoogleSignIn onSignIn={handleSignIn} onError={handleAuthError} />
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
            currentThreadId={currentThreadId}
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
                  {currentUser.name} ({currentUser.email})
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
