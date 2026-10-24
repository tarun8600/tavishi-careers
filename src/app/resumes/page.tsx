"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { EmptyState, Field, ResumeCard, Skeleton, type ResumeRow } from "@/components/ui";
import { checkResumeFile, cleanLabel, resumeStoragePath } from "@/lib/resumes/validate";

const BUCKET = "resumes";
const COLS = "id, filename, label, size_bytes, is_default, created_at, storage_path";
type Row = ResumeRow & { storage_path: string };

export default function ResumesPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!), []);
  const [userId, setUserId] = useState("");
  const [resumes, setResumes] = useState<Row[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace("/login?next=/resumes");
      setUserId(user.id);
      const { data, error } = await supabase.from("resumes").select(COLS).eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) setMessage("Unable to load resumes.");
      setResumes((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, [supabase, router]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !userId) return;
    const check = checkResumeFile(file);
    if (!check.ok) return setMessage(check.error);
    setBusy(true); setMessage("");
    const id = crypto.randomUUID();
    const path = resumeStoragePath(userId, id, check.ext);
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) { setBusy(false); return setMessage("Upload failed. Please try again."); }
    const { data, error } = await supabase.from("resumes")
      .insert({ id, user_id: userId, filename: file.name.slice(0, 200), storage_path: path, label: cleanLabel(label), mime_type: file.type, size_bytes: file.size, is_default: resumes.length === 0 })
      .select(COLS).single();
    if (error || !data) {
      await supabase.storage.from(BUCKET).remove([path]);
      setMessage("Unable to save the resume record.");
    } else {
      setResumes((c) => [data as Row, ...c]); setFile(null); setLabel(""); setMessage("Resume uploaded.");
      const picker = document.getElementById("resume-file") as HTMLInputElement | null;
      if (picker) picker.value = "";
    }
    setBusy(false);
  }

  async function download(r: Row) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(r.storage_path, 60);
    if (error || !data) return setMessage("Download failed.");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function makeDefault(r: Row) {
    setBusy(true);
    await supabase.from("resumes").update({ is_default: false }).eq("user_id", userId).neq("id", r.id);
    const { error } = await supabase.from("resumes").update({ is_default: true }).eq("id", r.id).eq("user_id", userId);
    if (error) setMessage("Unable to update default resume.");
    else setResumes((c) => c.map((x) => ({ ...x, is_default: x.id === r.id })));
    setBusy(false);
  }

  async function remove(r: Row) {
    if (!window.confirm(`Delete "${r.label ?? r.filename}"? This cannot be undone.`)) return;
    setBusy(true);
    const { data, error } = await supabase.from("resumes").delete().eq("id", r.id).eq("user_id", userId).select("id");
    if (error || !data?.length) { setBusy(false); return setMessage("Unable to delete. Resumes used by an application cannot be removed."); }
    const { error: sErr } = await supabase.storage.from(BUCKET).remove([r.storage_path]);
    setMessage(sErr ? "Resume deleted, but file cleanup failed." : "Resume deleted.");
    setResumes((c) => c.filter((x) => x.id !== r.id));
    setBusy(false);
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section className="tc-hero">
        <h1>Your resumes</h1>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>Keep a resume for each career path. Files are private to your account.</p>
      </section>
      <form onSubmit={upload} className="tc-card" style={{ display: "grid", gap: 4, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", alignItems: "end" }}>
        <Field label="Resume file" hint="PDF or DOCX, up to 5 MB">
          <input id="resume-file" type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Field>
        <Field label="Label (optional)" hint="e.g. Data Engineering">
          <input value={label} maxLength={80} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <div className="tc-field"><button type="submit" className="tc-btn tc-btn-primary" disabled={!file || busy}>{busy ? "Working…" : "Upload resume"}</button></div>
      </form>
      {message && <p role="status" className="tc-badge tc-tone-sky">{message}</p>}
      {loading ? <div className="tc-card"><Skeleton /></div>
        : resumes.length === 0 ? <EmptyState title="No resumes yet" body="Upload your first resume to start preparing applications." />
        : <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {resumes.map((r) => <ResumeCard key={r.id} resume={r} busy={busy} onDownload={() => download(r)} onDelete={() => remove(r)} onDefault={() => makeDefault(r)} />)}
          </div>}
    </div>
  );
}
