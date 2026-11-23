"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function SignInButton({ disabled = false }: { disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setError("");
    setBusy(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? "/PersonaBuilder"}/auth/callback`;
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (authError) throw authError;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start Google sign-in.");
      setBusy(false);
    }
  }

  return <>
    <button className="google-button" onClick={signIn} disabled={disabled || busy}>
      <span className="google-g">G</span>{busy ? "Connecting…" : "Continue with Google"}
    </button>
    {error && <p className="error-text">{error}</p>}
  </>;
}
