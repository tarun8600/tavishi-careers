
"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Application = {
  id: string;
  status: string;
  created_at: string;
  jobs: {
    title: string;
    company: string;
    location: string | null;
  } | null;
  resumes: {
    filename: string;
  } | null;
};

export default function ApplicationsPage() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      ),
    []
  );

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        window.location.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("applications")
        .select(
          "id,status,created_at,jobs(title,company,location),resumes(filename)"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage("Unable to load applications: " + error.message);
      } else {
        const normalized = (data ?? []).map((item) => ({
          ...item,
          jobs: Array.isArray(item.jobs)
            ? item.jobs[0] ?? null
            : item.jobs,
          resumes: Array.isArray(item.resumes)
            ? item.resumes[0] ?? null
            : item.resumes,
        }));

        setApplications(normalized as Application[]);
      }

      setLoading(false);
    }

    void load();
  }, [supabase]);

  return (
    <main
      style={{
        maxWidth: 950,
        margin: "40px auto",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <a href="/dashboard">← Back to Dashboard</a>

      <h1>My Applications</h1>
      <p>Track your job applications in one place.</p>

      {message && <p role="alert">{message}</p>}

      {loading ? (
        <p>Loading applications...</p>
      ) : applications.length === 0 ? (
        <section
          style={{
            background: "white",
            padding: 30,
            border: "1px solid #dce3ed",
            borderRadius: 12,
          }}
        >
          <h2>No applications yet</h2>
          <p>
            Once you create your first job application,
            it will appear here.
          </p>
          <a href="/jobs">Explore Jobs →</a>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {applications.map((application) => (
            <article
              key={application.id}
              style={{
                background: "white",
                padding: 24,
                borderRadius: 12,
                border: "1px solid #dce3ed",
              }}
            >
              <h2>
                {application.jobs?.title ?? "Unavailable Job"}
              </h2>
              <p>
                <strong>
                  {application.jobs?.company ?? "Unknown company"}
                </strong>
              </p>
              <p>
                Location:{" "}
                {application.jobs?.location ?? "Not specified"}
              </p>
              <p>
                Resume:{" "}
                {application.resumes?.filename ?? "Not selected"}
              </p>
              <p>
                Status:{" "}
                <strong>
                  {application.status.replaceAll("_", " ")}
                </strong>
              </p>
              <p>
                Created:{" "}
                {new Date(
                  application.created_at
                ).toLocaleDateString()}
              </p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
