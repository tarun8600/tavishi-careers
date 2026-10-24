export type ResumeRow = { id: string; filename: string; label: string | null; size_bytes: number | null; is_default: boolean; created_at: string };

export function formatBytes(n: number | null): string {
  if (!n) return "";
  return n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function ResumeCard({ resume, busy, onDownload, onDelete, onDefault }: { resume: ResumeRow; busy: boolean; onDownload: () => void; onDelete: () => void; onDefault: () => void }) {
  return (
    <article className="tc-card tc-card-hover" style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>{resume.label ?? resume.filename}</h3>
        {resume.is_default && <span className="tc-badge tc-tone-mint">Default</span>}
      </div>
      <p className="tc-hint" style={{ margin: 0 }}>
        {resume.filename}{resume.size_bytes ? ` · ${formatBytes(resume.size_bytes)}` : ""} · Uploaded {new Date(resume.created_at).toLocaleDateString("en", { dateStyle: "medium" })}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="tc-btn tc-btn-secondary" onClick={onDownload} disabled={busy}>Download</button>
        {!resume.is_default && <button type="button" className="tc-btn tc-btn-ghost" onClick={onDefault} disabled={busy}>Make default</button>}
        <button type="button" className="tc-btn tc-btn-danger" onClick={onDelete} disabled={busy}>Delete</button>
      </div>
    </article>
  );
}
