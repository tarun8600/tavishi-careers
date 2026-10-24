
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  
async function handleGoogleLogin() {
  setMessage("");

  try {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(new URLSearchParams(window.location.search).get("next") ?? "/dashboard")}`,
      },
    });

    if (error) {
      setMessage(error.message);
    }
  } catch {
    setMessage("Unable to start Google Sign-In.");
  }
}

  
  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setMessage("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      maxWidth: 440,
      margin: "60px auto",
      padding: 25,
      background: "white",
      borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-1)",
      border: "1px solid var(--border)",
    }}>
      <h1>Welcome Back</h1>
      <p>Sign in to your Tavishi Careers account.</p>

      
<button
  type="button"
  onClick={handleGoogleLogin}
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

      
      <form
        onSubmit={handleLogin}
        style={{ display: "grid", gap: 16 }}
      >
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {message && <p role="alert">{message}</p>}

      <p>
        Don&apos;t have an account?{" "}
        <Link href="/signup">Create Account</Link>
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
