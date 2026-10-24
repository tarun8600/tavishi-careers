
"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Resume = {
  id: string;
  filename: string;
};

type Application = {
  id: string;
  resume_id: string | null;
  status: string;
  created_at: string;
  approved_at: string | null;
  jobs: {
    title: string;
    company: string;
    location: string | null;
    description: string | null;
    apply_url: string | null;
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
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumes, setSelectedResumes] = useState<
    Record<string, string>
  >({});

  const [reviewId, setReviewId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !user) {
        window.location.replace("/login");
        return;
      }

      const [applicationResult, resumeResult] = await Promise.all([
        supabase
          .from("applications")
          .select(
            "id,resume_id,status,created_at,approved_at,jobs(title,company,location,description,apply_url),resumes(filename)"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("resumes")
          .select("id,filename")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (!active) return;

      if (applicationResult.error) {
        setMessage(
          "Unable to load applications: " +
            applicationResult.error.message
        );
      } else {
        const normalized = (applicationResult.data ?? []).map(
          (item) => ({
            ...item,
            jobs: Array.isArray(item.jobs)
              ? item.jobs[0] ?? null
              : item.jobs,
            resumes: Array.isArray(item.resumes)
              ? item.resumes[0] ?? null
              : item.resumes,
          })
        ) as Application[];

        setApplications(normalized);

        const initialSelections: Record<string, string> = {};

        normalized.forEach((application) => {
          initialSelections[application.id] =
            application.resume_id ?? "";
        });

        setSelectedResumes(initialSelections);
      }

      if (resumeResult.error) {
        setMessage(
          "Unable to load resumes: " + resumeResult.error.message
        );
      } else {
        setResumes(resumeResult.data ?? []);
      }

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [supabase]);

  async function updateDraft(
    applicationId: string,
    action: "change_resume" | "withdraw"
  ) {
    if (busyId !== null) return;

    const application = applications.find(
      (item) => item.id === applicationId
    );

    if (!application || application.status !== "draft") {
      setMessage("Only draft applications can be changed.");
      return;
    }

    const resumeId = selectedResumes[applicationId];

    if (action === "change_resume" && !resumeId) {
      setMessage("Please select a resume.");
      return;
    }

    if (action === "withdraw") {
      const confirmed = window.confirm(
        "Withdraw this draft application? You will not be able to edit it afterward."
      );

      if (!confirmed) return;
    }

    setBusyId(applicationId);
    setMessage("");

    try {
      const response = await fetch(
        `/api/applications/${applicationId}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            ...(action === "change_resume"
              ? { resumeId }
              : {}),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setMessage(
          result.error ?? "Unable to update application."
        );
        return;
      }

      if (action === "withdraw") {
        setApplications((current) =>
          current.map((item) =>
            item.id === applicationId
              ? { ...item, status: "withdrawn" }
              : item
          )
        );

        setMessage("Application draft withdrawn successfully.");
      } else {
        const newResume = resumes.find(
          (item) => item.id === resumeId
        );

        setApplications((current) =>
          current.map((item) =>
            item.id === applicationId
              ? {
                  ...item,
                  resume_id: resumeId,
                  resumes: newResume
                    ? { filename: newResume.filename }
                    : null,
                }
              : item
          )
        );

        setMessage("Application resume updated successfully.");
      }
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function approveApplication(applicationId: string) {
    if (busyId !== null) return;

    const application = applications.find(
      (item) => item.id === applicationId
    );

    if (!application || application.status !== "draft") {
      setMessage("Only draft applications can be approved.");
      return;
    }

    if (!application.resume_id || !application.resumes) {
      setMessage("Please select an uploaded resume first.");
      return;
    }

    if (
      selectedResumes[applicationId] !== application.resume_id
    ) {
      setMessage(
        "You changed the resume selection. Save the resume change before approving."
      );
      return;
    }

    const confirmed = window.confirm(
      `Approve this Tavishi Careers draft?\n\n` +
        `Job: ${application.jobs?.title ?? "Unavailable"}\n` +
        `Company: ${application.jobs?.company ?? "Unavailable"}\n` +
        `Resume: ${application.resumes.filename}\n\n` +
        "This records your approval in Tavishi Careers.\n" +
        "It does NOT submit an application to an employer.\n\n" +
        "The approved application cannot be edited as a draft.\n\n" +
        "Select OK to approve."
    );

    if (!confirmed) return;

    setBusyId(applicationId);
    setMessage("");

    try {
      const response = await fetch(
        `/api/applications/${applicationId}/approve`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setMessage(
          result.error ??
            "Unable to approve this application."
        );
        return;
      }

      setApplications((current) =>
        current.map((item) =>
          item.id === applicationId
            ? {
                ...item,
                status: "approved",
                approved_at: new Date().toISOString(),
              }
            : item
        )
      );

      setMessage(
        "Application approved successfully. No employer submission was performed."
      );
    } catch {
      setMessage(
        "Network error. Please refresh to check the status before trying again."
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div
      style={{
        maxWidth: 950,
        margin: "40px auto",
        padding: 24,
        
      }}
    >
      <a href="/dashboard">← Back to Dashboard</a>

      <h1 style={{ color: "var(--text)" }}>
        My Applications
      </h1>

      <p>Review, manage, approve, and track your applications.</p>

      {message && (
        <p
          role="status"
          style={{
            background: "var(--sky)",
            padding: 14,
            borderRadius: 8,
          }}
        >
          {message}
        </p>
      )}

      {loading ? (
        <p>Loading applications...</p>
      ) : applications.length === 0 ? (
        <section style={cardStyle}>
          <h2>No applications yet</h2>
          <p>
            Create your first application draft from the Jobs page.
          </p>
          <a href="/jobs">Explore Jobs →</a>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {applications.map((application) => {
            const isReviewing =
              reviewId === application.id;

            const isDraft =
              application.status === "draft";

            const isApproved =
              application.status === "approved";

            const isBusy =
              busyId === application.id;

            return (
              <article
                key={application.id}
                style={cardStyle}
              >
                <h2 style={{ color: "var(--text)" }}>
                  {application.jobs?.title ??
                    "Unavailable Job"}
                </h2>

                <p>
                  <strong>
                    {application.jobs?.company ??
                      "Unknown company"}
                  </strong>
                </p>

                <p>
                  Location:{" "}
                  {application.jobs?.location ??
                    "Not specified"}
                </p>

                <p>
                  Resume:{" "}
                  {application.resumes?.filename ??
                    "Not selected"}
                </p>

                <p>
                  Status:{" "}
                  <strong
                    style={{
                      color: isApproved
                        ? "var(--primary-strong)"
                        : application.status === "withdrawn"
                          ? "var(--danger)"
                          : "var(--text)",
                      textTransform: "capitalize",
                    }}
                  >
                    {application.status.replaceAll("_", " ")}
                  </strong>
                </p>

                <p>
                  Created:{" "}
                  {new Date(
                    application.created_at
                  ).toLocaleDateString()}
                </p>

                {application.approved_at && (
                  <p>
                    Approved:{" "}
                    {new Date(
                      application.approved_at
                    ).toLocaleDateString()}
                  </p>
                )}

                <button
                  type="button"
                  style={buttonStyle}
                  aria-expanded={isReviewing}
                  onClick={() =>
                    setReviewId(
                      isReviewing ? null : application.id
                    )
                  }
                >
                  {isReviewing
                    ? "Close Review"
                    : "Review Application"}
                </button>

                {isReviewing && (
                  <section
                    style={{
                      marginTop: 24,
                      padding: 20,
                      background: "var(--sky)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                    }}
                  >
                    <h3>Application Review</h3>

                    <p>
                      <strong>Job:</strong>{" "}
                      {application.jobs?.title ??
                        "Unavailable"}
                    </p>

                    <p>
                      <strong>Company:</strong>{" "}
                      {application.jobs?.company ??
                        "Unavailable"}
                    </p>

                    <p>
                      <strong>Location:</strong>{" "}
                      {application.jobs?.location ??
                        "Not specified"}
                    </p>

                    <h4>Job Description</h4>

                    <p
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.7,
                      }}
                    >
                      {application.jobs?.description ??
                        "No description available."}
                    </p>

                    <h4>Selected Resume</h4>

                    <p>
                      {application.resumes?.filename ??
                        "No resume selected"}
                    </p>

                    {isDraft ? (
                      <div
                        style={{
                          background: "white",
                          padding: 20,
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                        }}
                      >
                        <h3>Manage Draft</h3>

                        <label
                          htmlFor={`resume-${application.id}`}
                          style={{
                            display: "block",
                            fontWeight: 600,
                            marginBottom: 10,
                          }}
                        >
                          Change Resume
                        </label>

                        <select
                          id={`resume-${application.id}`}
                          value={
                            selectedResumes[application.id] ??
                            ""
                          }
                          disabled={busyId !== null}
                          onChange={(event) =>
                            setSelectedResumes((current) => ({
                              ...current,
                              [application.id]:
                                event.target.value,
                            }))
                          }
                          style={inputStyle}
                        >
                          <option value="">
                            Select a resume
                          </option>

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
                          disabled={
                            busyId !== null ||
                            !selectedResumes[
                              application.id
                            ] ||
                            selectedResumes[
                              application.id
                            ] === application.resume_id
                          }
                          onClick={() =>
                            updateDraft(
                              application.id,
                              "change_resume"
                            )
                          }
                          style={{
                            ...buttonStyle,
                            marginTop: 14,
                          }}
                        >
                          {isBusy
                            ? "Processing..."
                            : "Save Resume Change"}
                        </button>

                        <p style={{ marginTop: 22 }}>
                          <a href="/resumes">
                            Upload Another Resume →
                          </a>
                        </p>

                        <hr style={dividerStyle}/>

                        <h3>Approve Application</h3>

                        <p>
                          Confirm the job and selected resume
                          before approving this draft.
                        </p>

                        <p>
                          Approval records consent in Tavishi
                          Careers. It does not submit an
                          application to an employer.
                        </p>

                        <button
                          type="button"
                          disabled={
                            busyId !== null ||
                            !application.resume_id ||
                            selectedResumes[
                              application.id
                            ] !== application.resume_id
                          }
                          onClick={() =>
                            approveApplication(
                              application.id
                            )
                          }
                          style={{
                            ...buttonStyle,
                            background: "var(--primary-strong)",
                          }}
                        >
                          {isBusy
                            ? "Processing..."
                            : "Approve Application"}
                        </button>

                        {selectedResumes[
                          application.id
                        ] !== application.resume_id && (
                          <p>
                            Save your resume change before
                            approving.
                          </p>
                        )}

                        <hr style={dividerStyle}/>

                        <h4>Withdraw Draft</h4>

                        <p>
                          Withdraw this draft if you no
                          longer want to continue with it.
                        </p>

                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() =>
                            updateDraft(
                              application.id,
                              "withdraw"
                            )
                          }
                          style={{
                            ...buttonStyle,
                            background: "var(--danger)",
                          }}
                        >
                          {isBusy
                            ? "Processing..."
                            : "Withdraw Draft"}
                        </button>
                      </div>
                    ) : isApproved ? (
                      <div
                        style={{
                          background: "var(--primary-light)",
                          padding: 20,
                          border: "1px solid var(--primary-light)",
                          borderRadius: 10,
                        }}
                      >
                        <h3 style={{ color: "var(--primary-strong)" }}>
                          Application Approved
                        </h3>

                        <p>
                          Your approval has been recorded
                          in Tavishi Careers.
                        </p>

                        <p>
                          This application is no longer
                          editable as a draft.
                        </p>

                        <strong>
                          No employer submission has been
                          performed.
                        </strong>
                      </div>
                    ) : (
                      <p>
                        This application&apos;s current status
                        is{" "}
                        <strong>
                          {application.status.replaceAll(
                            "_",
                            " "
                          )}
                        </strong>
                        . It cannot be edited using
                        the draft controls.
                      </p>
                    )}

                    <p style={{ marginTop: 20 }}>
                      <strong>Submission:</strong>{" "}
                      This review page does not send
                      applications to employers.
                    </p>
                  </section>
                )}
              </article>
            );
          })}
        </div>
      )}

      <p style={{ marginTop: 30 }}>
        <a href="/jobs">Explore More Jobs →</a>
      </p>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "white",
  padding: 24,
  borderRadius: 12,
  border: "1px solid var(--border)",
};

const buttonStyle: React.CSSProperties = {
  background: "var(--primary-strong)",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "12px 20px",
  fontWeight: 600,
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: 12,
  border: "1px solid var(--border)",
  borderRadius: 8,
  background: "white",
  color: "var(--text)",
};

const dividerStyle: React.CSSProperties = {
  border: 0,
  borderTop: "1px solid var(--border)",
  margin: "24px 0",
};
