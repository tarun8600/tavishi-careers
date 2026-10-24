
"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  apply_url: string | null;
};

type Resume = {
  id: string;
  filename: string;
};

export default function Jobs() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      ),
    []
  );

  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [workplace, setWorkplace] = useState("all");

  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draftBusyId, setDraftBusyId] = useState<string | null>(null);

  const [message, setMessage] = useState("");

  // Load available jobs, user bookmarks and resumes.
  useEffect(() => {
    let active = true;

    async function load() {
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select(
          "id,title,company,location,description,apply_url"
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (jobError) {
        setMessage("Unable to load jobs: " + jobError.message);
      } else {
        setJobs(jobData ?? []);
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!authError && user) {
        setUserId(user.id);

        // Load saved job IDs.
        const { data: saved, error: savedError } =
          await supabase
            .from("saved_jobs")
            .select("job_id")
            .eq("user_id", user.id);

        if (!active) return;

        if (savedError) {
          setMessage(
            "Unable to load saved jobs: " + savedError.message
          );
        } else {
          setSavedIds(
            (saved ?? []).map((item) => item.job_id)
          );
        }

        // Load the user's previously uploaded resumes.
        const {
          data: userResumes,
          error: resumeError,
        } = await supabase
          .from("resumes")
          .select("id,filename")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!active) return;

        if (resumeError) {
          setMessage(
            "Unable to load resumes: " + resumeError.message
          );
        } else {
          setResumes(userResumes ?? []);

          if (userResumes?.length) {
            setSelectedResumeId(userResumes[0].id);
          }
        }
      }

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [supabase]);

  // Search and filter jobs.
  const filteredJobs = useMemo(() => {
    const query = search.toLowerCase().trim();
    const place = location.toLowerCase().trim();

    return jobs.filter((job) => {
      const text = [
        job.title,
        job.company,
        job.description ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const jobLocation = (job.location ?? "").toLowerCase();

      const matchesSearch =
        !query || text.includes(query);

      const matchesLocation =
        !place || jobLocation.includes(place);

      const matchesWorkplace =
        workplace === "all" ||
        (workplace === "remote" &&
          jobLocation.includes("remote")) ||
        (workplace === "hybrid" &&
          jobLocation.includes("hybrid")) ||
        (workplace === "onsite" &&
          !jobLocation.includes("remote") &&
          !jobLocation.includes("hybrid"));

      return (
        matchesSearch &&
        matchesLocation &&
        matchesWorkplace
      );
    });
  }, [jobs, search, location, workplace]);

  // Save or remove a bookmarked job.
  async function toggleSave(jobId: string) {
    if (!userId) {
      window.location.href = "/login";
      return;
    }

    if (busyId !== null) return;

    setBusyId(jobId);
    setMessage("");

    const alreadySaved = savedIds.includes(jobId);

    if (alreadySaved) {
      const { error } = await supabase
        .from("saved_jobs")
        .delete()
        .eq("user_id", userId)
        .eq("job_id", jobId);

      if (error) {
        setMessage(
          "Unable to remove bookmark: " + error.message
        );
      } else {
        setSavedIds((current) =>
          current.filter((id) => id !== jobId)
        );
        setMessage("Job removed from Saved Jobs.");
      }
    } else {
      const { error } = await supabase
        .from("saved_jobs")
        .insert({
          user_id: userId,
          job_id: jobId,
        });

      if (error) {
        setMessage("Unable to save job: " + error.message);
      } else {
        setSavedIds((current) => [...current, jobId]);
        setMessage("Job saved successfully!");
      }
    }

    setBusyId(null);
  }

  // Create a draft application without submitting to employers.
  async function createDraft(jobId: string) {
    if (!userId) {
      window.location.href = "/login";
      return;
    }

    if (!selectedResumeId) {
      setMessage("Please upload and select a resume first.");
      return;
    }

    if (draftBusyId !== null) return;

    setDraftBusyId(jobId);
    setMessage("");

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          jobId,
          resumeId: selectedResumeId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(
          result.error ??
            "Unable to create application draft."
        );
        return;
      }

      setMessage("Draft application created successfully!");

      // Open the applications dashboard.
      window.location.href = "/applications";
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setDraftBusyId(null);
    }
  }

  return (
    <div style={{ }}>
      {/* Hero section */}
      <section
        style={{
          background:
            "var(--aurora)",
          color: "var(--text)",
          padding: "48px 32px",
          borderRadius: 16,
          marginBottom: 28,
        }}
      >
        <p
          style={{
            color: "var(--primary-strong)",
            fontWeight: 700,
          }}
        >
          TAVISHI CAREERS
        </p>

        <h1 style={{ fontSize: 38 }}>
          Explore opportunities
        </h1>

        <p>
          Search jobs, save opportunities, and prepare
          application drafts with your resumes.
        </p>
      </section>

      {/* Job filters */}
      <section
        style={{
          background: "white",
          padding: 24,
          border: "1px solid var(--border)",
          borderRadius: 14,
          marginBottom: 25,
        }}
      >
        <h2>Find your next job</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 15,
          }}
        >
          <label>
            Job title or company
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. SOC Analyst"
              style={inputStyle}
            />
          </label>

          <label>
            Location
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. New York"
              style={inputStyle}
            />
          </label>

          <label>
            Work arrangement
            <select
              value={workplace}
              onChange={(e) => setWorkplace(e.target.value)}
              style={inputStyle}
            >
              <option value="all">
                All arrangements
              </option>
              <option value="remote">
                Remote
              </option>
              <option value="hybrid">
                Hybrid
              </option>
              <option value="onsite">
                Onsite
              </option>
            </select>
          </label>
        </div>
      </section>

      {/* Available jobs */}
      <section>
        <h2>Available Jobs</h2>

        {message && (
          <p role="status">{message}</p>
        )}

        <p>
          {loading
            ? "Loading jobs..."
            : `${filteredJobs.length} results`}
        </p>

        {!loading && filteredJobs.length === 0 && (
          <p>
            No jobs found. Your database may be empty,
            or your filters may be too restrictive.
          </p>
        )}

        <div style={{ display: "grid", gap: 16 }}>
          {filteredJobs.map((job) => {
            const saved = savedIds.includes(job.id);

            return (
              <article
                key={job.id}
                style={{
                  background: "white",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: 25,
                }}
              >
                <h3 style={{ fontSize: 23 }}>
                  {job.title}
                </h3>

                <p
                  style={{
                    color: "var(--primary-strong)",
                    fontWeight: 700,
                  }}
                >
                  {job.company}
                </p>

                <p>
                  📍 {job.location || "Not specified"}
                </p>

                <p style={{ lineHeight: 1.7 }}>
                  {job.description ||
                    "No description available."}
                </p>

                {/* Bookmark button */}
                <button
                  type="button"
                  onClick={() => toggleSave(job.id)}
                  disabled={
                    busyId !== null ||
                    draftBusyId !== null
                  }
                  style={buttonStyle}
                >
                  {busyId === job.id
                    ? "Please wait..."
                    : saved
                      ? "★ Remove Saved Job"
                      : "☆ Save Job"}
                </button>

                {/* Resume selection and draft creation */}
                <div
                  style={{
                    marginTop: 20,
                    paddingTop: 18,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <label
                    htmlFor={`resume-${job.id}`}
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                    }}
                  >
                    Choose resume for application
                  </label>

                  {!userId ? (
                    <p>
                      <a href="/login">
                        Sign in to create application drafts →
                      </a>
                    </p>
                  ) : resumes.length === 0 ? (
                    <p>
                      No resumes uploaded.{" "}
                      <a href="/resumes">
                        Upload a resume →
                      </a>
                    </p>
                  ) : (
                    <>
                      <select
                        id={`resume-${job.id}`}
                        value={selectedResumeId}
                        onChange={(event) =>
                          setSelectedResumeId(
                            event.target.value
                          )
                        }
                        style={{
                          ...inputStyle,
                          marginBottom: 12,
                        }}
                      >
                        {resumes.map((resume) => (
                          <option
                            key={resume.id}
                            value={resume.id}
                          >
                            {resume.filename}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          createDraft(job.id)
                        }
                        disabled={
                          draftBusyId !== null ||
                          busyId !== null ||
                          !selectedResumeId
                        }
                        style={buttonStyle}
                      >
                        {draftBusyId === job.id
                          ? "Creating Draft..."
                          : "Create Draft Application"}
                      </button>
                    </>
                  )}
                </div>

                {/* Existing external application link */}
                {job.apply_url && (
                  <p style={{ marginTop: 18 }}>
                    <a
                      href={job.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open application ↗
                    </a>
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <p style={{ marginTop: 25 }}>
        <a href="/dashboard">
          ← Back to Dashboard
        </a>
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  marginTop: 8,
  padding: 13,
  border: "1px solid var(--border)",
  borderRadius: 8,
  background: "white",
  color: "var(--text)",
};

const buttonStyle: React.CSSProperties = {
  background: "var(--primary-strong)",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "12px 22px",
  fontWeight: 700,
  cursor: "pointer",
};
