import { useState, useEffect, useCallback } from "react";
import type { User } from "@ocha/types";
import { client } from "../lib/api";

interface UseAuthReturn {
  user: User | null;
  authError: string | null;
  isLoading: boolean;
  token: string | null;
  signIn: (userData: User) => void;
  signOut: () => void;
  setAuthError: (error: string | null) => void;
  getAuthHeaders: () => Record<string, string>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setTokenState] = useState<string | null>(null);

  // Get authorization headers for API requests
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  // Sign in user
  const signIn = useCallback((userData: User) => {
    setUser(userData);
    setAuthError(null);
    // Update token from localStorage after sign-in
    const storedToken = localStorage.getItem("auth_token");
    setTokenState(storedToken);
    console.log("User signed in:", userData);
  }, []);

  // Sign out user
  const signOut = useCallback(() => {
    localStorage.removeItem("auth_token");
    setUser(null);
    setAuthError(null);
    setTokenState(null);
    console.log("User signed out");
  }, []);

  // Verify existing token on mount
  const verifyToken = useCallback(async () => {
    const storedToken = localStorage.getItem("auth_token");
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setTokenState(storedToken);

    try {
      const response = await client.api.auth.verify.$post(
        {
          json: {},
        },
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setAuthError(null);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem("auth_token");
        setUser(null);
        setTokenState(null);
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      localStorage.removeItem("auth_token");
      setUser(null);
      setTokenState(null);
      setAuthError("Authentication verification failed");
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  // Check for existing token on mount
  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  // Listen for localStorage changes (for token updates)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedToken = localStorage.getItem("auth_token");
      setTokenState(storedToken);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return {
    user,
    authError,
    isLoading,
    token,
    signIn,
    signOut,
    setAuthError,
    getAuthHeaders,
  };
}
