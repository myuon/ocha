import type { Thread, User } from "@ocha/types";
import { useState } from "react";
import { Outlet, useLoaderData, useLocation } from "react-router-dom";
import { GoogleSignIn } from "../../src/components/GoogleSignIn";
import { ThreadList } from "../../src/components/ThreadList";
import { useAuth } from "../../src/hooks/useAuth";

interface LayoutData {
  user: User | null;
  threads: Thread[];
}

export async function loader(): Promise<LayoutData> {
  // Server-side rendering時はlocalStorageが使用できないため、クライアント専用
  if (typeof window === 'undefined') {
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
  const initialData = useLoaderData() as LayoutData;
  const location = useLocation();
  const { user, signIn, signOut, setAuthError } = useAuth();
  
  // Use loader data as initial state, but let useAuth manage auth state
  const currentUser = user || initialData.user;
  const threads = initialData.threads; // loader data for initial threads
  
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(() => {
    // Extract thread ID from URL path
    const match = location.pathname.match(/^\/threads\/(.+)$/);
    return match ? match[1] : null;
  });

  const handleSignIn = async (userData: User) => {
    signIn(userData);
    // Reload the page to get fresh data
    window.location.reload();
  };

  const handleSignOut = () => {
    signOut();
    setCurrentThreadId(null);
    // Reload to clear all data
    window.location.href = "/";
  };

  const handleAuthError = (error: string) => {
    setAuthError(error);
  };

  const handleThreadSelect = (threadId: string) => {
    setCurrentThreadId(threadId);
    window.location.href = `/threads/${threadId}`;
  };

  const handleNewThread = () => {
    setCurrentThreadId(null);
    window.location.href = "/";
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
        <div style={{ flex: 1, display: "flex" }}>
          <ThreadList
            threads={threads}
            currentThreadId={currentThreadId}
            onThreadSelect={handleThreadSelect}
            onNewThread={handleNewThread}
          />
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {/* Header */}
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
            <Outlet />
          </div>
        </div>
      )}
    </div>
  );
}