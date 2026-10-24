
"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function ProfilePage() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      ),
    []
  );

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        window.location.replace("/login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, headline, skills")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setMessage("Unable to load profile: " + error.message);
      } else if (data) {
        setFullName(data.full_name ?? "");
        setHeadline(data.headline ?? "");
        setSkills((data.skills ?? []).join(", "));
      }

      setLoading(false);
    }

    loadProfile();
  }, [supabase]);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userId) return;

    setSaving(true);
    setMessage("");

    const skillList = [
      ...new Set(
        skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      ),
    ];

    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName.trim(),
        headline: headline.trim(),
        skills: skillList,
      },
      { onConflict: "id" }
    );

    setMessage(
      error
        ? "Error saving profile: " + error.message
        : "Profile saved successfully!"
    );

    setSaving(false);
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Loading profile...</div>;
  }

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "40px auto",
        padding: 24,
        
      }}
    >
      <a href="/dashboard">← Back to Dashboard</a>

      <h1>My Profile</h1>
      <p>Manage your Tavishi Careers job seeker profile.</p>

      <form onSubmit={saveProfile}>
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          value={email}
          disabled
          style={inputStyle}
        />

        <label htmlFor="fullName">Full Name</label>
        <input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          style={inputStyle}
        />

        <label htmlFor="headline">Professional Headline</label>
        <input
          id="headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Example: Cybersecurity Analyst"
          style={inputStyle}
        />

        <label htmlFor="skills">Skills (comma-separated)</label>
        <textarea
          id="skills"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="Python, Splunk, SQL, Incident Response"
          rows={4}
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "12px 24px",
            background: "var(--primary-strong)",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: saving ? "wait" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      {message && <p role="status">{message}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: 12,
  marginTop: 8,
  marginBottom: 22,
  border: "1px solid var(--border)",
  borderRadius: 8,
  boxSizing: "border-box",
};
