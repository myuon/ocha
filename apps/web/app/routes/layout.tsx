import { useState } from "react";
import { Outlet, useLocation, useLoaderData } from "react-router-dom";
import { GoogleSignIn } from "../../src/components/GoogleSignIn";
import { ThreadList } from "../../src/components/ThreadList";

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

interface Thread {
  id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

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
    console.error("Layout loader error:", error);
    localStorage.removeItem("auth_token");
    return { user: null, threads: [] };
  }
}

export default function Layout() {
  const { user, threads } = useLoaderData<LayoutData>();
  const location = useLocation();
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Extract threadId from current path
  const threadMatch = location.pathname.match(/^\/threads\/(.+)$/);
  const currentThreadId = threadMatch ? threadMatch[1] : null;

  const handleSignIn = async (userData: User) => {
    // Reload the page to trigger the loader with new auth state
    window.location.reload();
  };

  const handleSignOut = () => {
    localStorage.removeItem("auth_token");
    window.location.href = "/";
  };

  const handleAuthError = (error: string) => {
    setAuthError(error);
    console.error("Auth error:", error);
  };

  const handleNewThread = () => {
    window.location.href = "/";
  };

  const handleThreadSelect = (threadId: string) => {
    window.location.href = `/threads/${threadId}`;
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", height: "100vh", display: "flex" }}>
      {/* Sidebar */}
      {user && (
        <ThreadList
          threads={threads}
          currentThreadId={currentThreadId}
          onThreadSelect={handleThreadSelect}
          onNewThread={handleNewThread}
        />
      )}

      {/* Main Content */}
      {!user ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Header for non-authenticated users */}
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
            <div>
              <GoogleSignIn onSignIn={handleSignIn} onError={handleAuthError} />
              {authError && (
                <p style={{ color: "red", marginTop: 8, fontSize: "0.9em" }}>
                  {authError}
                </p>
              )}
            </div>
          </div>
          
          {/* Sign-in prompt */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <div
              style={{
                textAlign: "center",
                backgroundColor: "#f9f9f9",
                borderRadius: 8,
                border: "1px solid #e0e0e0",
                padding: 32,
                maxWidth: 400,
              }}
            >
              <p style={{ color: "#666", fontSize: "1.1em", marginBottom: 16 }}>
                Please sign in with Google to start chatting with the AI
              </p>
            </div>
          </div>
        </div>
      ) : (
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
                onClick={handleSignOut}
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

          {/* Page Content */}
          <Outlet />
        </div>
      )}
    </div>
  );
}