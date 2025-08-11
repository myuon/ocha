import type { User } from "@ocha/types";
import { useEffect, useRef } from "react";
import { CLIENT_ID } from "../config";
import { client, getAuthHeaders } from "../lib/api";

interface GoogleSignInProps {
  onSignIn: (user: User) => void;
  onError: (error: string) => void;
}

export function GoogleSignIn({ onSignIn, onError }: GoogleSignInProps) {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.google || !buttonRef.current) return;

    const handleCredentialResponse = async (response: {
      credential: string;
    }) => {
      try {
        const result = await client.api.auth.google.$post(
          {
            json: { credential: response.credential },
          },
          {
            headers: getAuthHeaders(),
          }
        );
        const data = await result.json();

        if (result.ok) {
          // Type guard to check if response has success property
          if ("success" in data && data.success) {
            // Store JWT token in localStorage
            if ("token" in data && data.token) {
              localStorage.setItem("auth_token", data.token);
            }
            if ("user" in data) {
              onSignIn(data.user);
            }
          } else {
            const errorMsg = "error" in data ? data.error : "Authentication failed";
            onError(errorMsg);
          }
        } else {
          const errorMsg = "error" in data ? data.error : "Authentication failed";
          onError(errorMsg);
        }
      } catch (error) {
        console.error("Auth error:", error);
        onError("Network error during authentication");
      }
    };

    // Initialize Google Sign-In
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredentialResponse,
    });

    // Render the sign-in button
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: 250,
    });
  }, [onSignIn, onError]);

  return (
    <div>
      <div ref={buttonRef}></div>
    </div>
  );
}
