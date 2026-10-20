
"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type SavedJob = {
  user_id: string;
  job_id: string;
  created_at: string;
  jobs: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    description: string | null;
    apply_url: string | null;
  } | null;
};

export default function SavedJobsPage() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      ),
    []
  );

  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
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

      setUserId(user.id);

      const { data, error } = await supabase
        .from("saved_jobs")
        .select(
          "user_id,job_id,created_at,jobs(id,title,company,location,description,apply_url)"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage("Unable to load saved jobs: " + error.message);
      } else {
        // Supabase can type embedded relationships as arrays.
        // Normalize them to a single job object.
        const normalized = (data ?? []).map((item) => ({
          ...item,
          jobs: Array.isArray(item.jobs)
            ? item.jobs[0] ?? null
            : item.jobs,
        }));

        setSavedJobs(normalized as SavedJob[]);
      }

      setLoading(false);
    }

    void load();
  }, [supabase]);

  async function removeJob(jobId: string) {
    if (!userId || busyId) return;

    setBusyId(jobId);
    setMessage("");

    const { error } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("user_id", userId)
      .eq("job_id", jobId);

    if (error) {
      setMessage("Unable to remove job: " + error.message);
    } else {
      setSavedJobs((current) =>
        current.filter((item) => item.job_id !== jobId)
      );
      setMessage("Job removed from saved jobs.");
    }

    setBusyId("");
  }

  if (loading) {
    return <main style={{ padding: 40 }}>Loading saved jobs...</main>;
  }

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

      <h1>Saved Jobs</h1>
      <p>Manage the job opportunities you've bookmarked.</p>

      {message && <p role="status">{message}</p>}

      {savedJobs.length === 0 ? (
        <section
          style={{
            background: "white",
            padding: 30,
            borderRadius: 12,
            border: "1px solid #dce3ed",
          }}
        >
          <h2>No saved jobs yet</h2>
          <p>Browse job listings and save opportunities you like.</p>
          <a href="/jobs">Explore Jobs →</a>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {savedJobs.map((saved) => (
            <article
              key={saved.job_id}
              style={{
                background: "white",
                padding: 24,
                borderRadius: 12,
                border: "1px solid #dce3ed",
              }}
            >
              <h2>
                {saved.jobs?.title ?? "Unavailable Job"}
              </h2>

              <p style={{ fontWeight: 700 }}>
                {saved.jobs?.company ?? "Unknown Company"}
              </p>

              <p>
                📍 {saved.jobs?.location ?? "Not specified"}
              </p>

              <p>{saved.jobs?.description}</p>

              {saved.jobs?.apply_url && (
                <p>
                  <a
                    href={saved.jobs.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open application ↗
                  </a>
                </p>
              )}

              <button
                type="button"
                disabled={busyId !== ""}
                onClick={() => removeJob(saved.job_id)}
                style={{
                  background: "#155a91",
                  color: "white",
                  padding: "10px 18px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                {busyId === saved.job_id
                  ? "Removing..."
                  : "Remove Saved Job"}
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
