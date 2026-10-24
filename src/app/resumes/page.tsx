
"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Resume = {
  id: string;
  filename: string;
  storage_path: string;
  created_at: string;
};

const BUCKET = "resumes";
const MAX_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function ResumesPage() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      ),
    []
  );

  const [userId, setUserId] = useState("");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
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
        .from("resumes")
        .select("id, filename, storage_path, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) setMessage(error.message);
      else setResumes(data ?? []);

      setLoading(false);
    }

    void load();
  }, [supabase]);

  async function uploadResume() {
    if (!userId || !file || busy) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setMessage("Please select a PDF or DOCX file.");
      return;
    }

    if (file.size > MAX_SIZE || file.size === 0) {
      setMessage("Resume must be between 1 byte and 5 MB.");
      return;
    }

    setBusy(true);
    setMessage("");

    const id = crypto.randomUUID();
    const extension =
      file.type === "application/pdf" ? "pdf" : "docx";
    const path = `${userId}/${id}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      setMessage("Upload failed: " + uploadError.message);
      setBusy(false);
      return;
    }

    const { data, error: dbError } = await supabase
      .from("resumes")
      .insert({
        id,
        user_id: userId,
        filename: file.name,
        storage_path: path,
      })
      .select("id, filename, storage_path, created_at")
      .single();

    if (dbError) {
      await supabase.storage.from(BUCKET).remove([path]);
      setMessage("Unable to save resume record: " + dbError.message);
    } else if (data) {
      setResumes((current) => [data, ...current]);
      setFile(null);
      const picker = document.getElementById(
        "resume-file"
      ) as HTMLInputElement | null;
      if (picker) picker.value = "";
      setMessage("Resume uploaded successfully!");
    }

    setBusy(false);
  }

  async function downloadResume(resume: Resume) {
    setMessage("");

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(resume.storage_path);

    if (error || !data) {
      setMessage("Download failed: " + (error?.message ?? "Unknown error"));
      return;
    }

    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = resume.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function deleteResume(resume: Resume) {
    if (!window.confirm(`Delete "${resume.filename}"?`)) return;

    setBusy(true);
    setMessage("");

    // Delete the database record before removing the file.
    const { data, error: dbError } = await supabase
      .from("resumes")
      .delete()
      .eq("id", resume.id)
      .eq("user_id", userId)
      .select("id");

    if (dbError || !data?.length) {
      setMessage(
        "Unable to delete resume record: " +
          (dbError?.message ?? "Resume not found")
      );
      setBusy(false);
      return;
    }

    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([resume.storage_path]);

    if (storageError) {
      setMessage(
        "Resume record deleted, but file cleanup failed: " +
          storageError.message
      );
    } else {
      setMessage("Resume deleted successfully.");
    }

    setResumes((current) =>
      current.filter((item) => item.id !== resume.id)
    );
    setBusy(false);
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Loading resumes...</div>;
  }

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "40px auto",
        padding: 24,
        
      }}
    >
      <a href="/dashboard">← Back to Dashboard</a>
      <h1>My Resumes</h1>
      <p>Upload and manage your resumes securely.</p>

      <section
        style={{
          background: "white",
          padding: 24,
          border: "1px solid var(--border)",
          borderRadius: 12,
          marginBottom: 24,
        }}
      >
        <h2>Upload Resume</h2>
        <p>PDF or DOCX only, maximum 5 MB.</p>
        <input
          id="resume-file"
          type="file"
          accept=".pdf,.docx"
          onChange={(event) =>
            setFile(event.target.files?.[0] ?? null)
          }
          disabled={busy}
        />
        <button
          type="button"
          onClick={uploadResume}
          disabled={!file || busy}
          style={{
            display: "block",
            marginTop: 18,
            padding: "12px 20px",
            background: "var(--primary-strong)",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {busy ? "Please wait..." : "Upload Resume"}
        </button>
      </section>

      <h2>Uploaded Resumes</h2>

      {resumes.length === 0 ? (
        <p>No resumes uploaded yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {resumes.map((resume) => (
            <article
              key={resume.id}
              style={{
                padding: 18,
                border: "1px solid var(--border)",
                borderRadius: 10,
                background: "white",
              }}
            >
              <strong>{resume.filename}</strong>
              <p>
                Uploaded:{" "}
                {new Date(resume.created_at).toLocaleDateString()}
              </p>
              <button
                onClick={() => downloadResume(resume)}
                disabled={busy}
              >
                Download
              </button>{" "}
              <button
                onClick={() => deleteResume(resume)}
                disabled={busy}
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      )}

      {message && <p role="status">{message}</p>}
    </div>
  );
}
