import { useEffect, useRef } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

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
        const result = await fetch("/api/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: response.credential,
          }),
        });

        const data = await result.json();

        if (result.ok && data.success) {
          onSignIn(data.user);
        } else {
          onError(data.error || "Authentication failed");
        }
      } catch (error) {
        console.error("Auth error:", error);
        onError("Network error during authentication");
      }
    };

    // Initialize Google Sign-In
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
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
