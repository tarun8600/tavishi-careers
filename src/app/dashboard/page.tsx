
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function checkUser() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      setEmail(data.user.email || "");
      setLoading(false);
    }

    checkUser();
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return <main><p>Checking your account...</p></main>;
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto" }}>
      <h1>Welcome to Tavishi Careers!</h1>

      <p>
        Signed in as: <strong>{email}</strong>
      </p>

      <section style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 18,
        marginTop: 30
      }}>
        {[
          ["My Profile", "Manage your personal details"],
          ["My Resumes", "Upload and manage resumes"],
          ["Saved Jobs", "View your bookmarked jobs"],
          ["My Applications", "Track application progress"]
        ].map(([title, description]) => (
          
<article
  key={title}
  style={{
    background: "white",
    padding: 25,
    border: "1px solid #dce3ed",
    borderRadius: 12,
  }}
>
  <h2 style={{ fontSize: 20 }}>{title}</h2>
  <p>{description}</p>

  {title === "My Profile" ? (
    <a
      href="/profile"
      style={{
        display: "inline-block",
        marginTop: 10,
        padding: "10px 16px",
        background: "#155e95",
        color: "white",
        borderRadius: 8,
        textDecoration: "none",
      }}
    >
      View My Profile →
    
</a>
) : title === "My Resumes" ? (
  <a
    href="/resumes"
    style={{
      display: "inline-block",
      marginTop: 10,
      padding: "10px 16px",
      background: "#155e95",
      color: "white",
      borderRadius: 8,
      textDecoration: "none",
    }}
  >
    Manage My Resumes →
  
</a>
) : title === "Saved Jobs" ? (
  <a
    href="/saved-jobs"
    style={{
      display: "inline-block",
      marginTop: 10,
      padding: "10px 16px",
      background: "#155e95",
      color: "white",
      borderRadius: 8,
      textDecoration: "none",
    }}
  >
    View Saved Jobs →
  
</a>
) : title === "My Applications" ? (
  <a
    href="/applications"
    style={{
      display: "inline-block",
      marginTop: 10,
      padding: "10px 16px",
      background: "#155e95",
      color: "white",
      borderRadius: 8,
      textDecoration: "none",
    }}
  >
    View My Applications →
  </a>
) : (
  <small>Coming soon</small>
)}



</article>

        ))}
      </section>

      <button
        onClick={handleLogout}
        style={{
          marginTop: 30,
          background: "#155a91",
          color: "white",
          padding: "12px 22px",
          border: "none",
          borderRadius: 8,
          cursor: "pointer"
        }}
      >
        Sign Out
      </button>
    </main>
  );
}
