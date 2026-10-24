
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  
async function handleGoogleSignup() {
  setMessage("");

  try {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
    }
  } catch {
    setMessage("Unable to start Google Sign-In.");
  }
}

  
  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Registration requested. Please check your email for a confirmation link."
        );
      }
    } catch {
      setMessage("Registration failed. Please check the configuration.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tc-card" style={{ maxWidth: 440, margin: "40px auto", padding: 28 }}>
      <h1>Create your account</h1>
      <p>Join Tavishi Careers and start your job search.</p>

      
<button
  type="button"
  onClick={handleGoogleSignup}
  style={{
    width: "100%",
    padding: "14px",
    marginBottom: "20px",
    background: "white",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    fontWeight: 600,
    cursor: "pointer",
  }}
>
  Continue with Google
</button>

      
      <form onSubmit={handleSignup} style={{ display: "grid", gap: 16 }}>
        <label>
          Email Address
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </label>

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      {message && <p role="status">{message}</p>}

      <p>
        Already registered? <Link href="/login">Sign In</Link>
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: 12,
  marginTop: 8,
  boxSizing: "border-box",
  border: "1px solid var(--border)",
  borderRadius: 8,
};

const buttonStyle: React.CSSProperties = {
  background: "var(--primary-strong)",
  color: "white",
  padding: 14,
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  cursor: "pointer",
};
