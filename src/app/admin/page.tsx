"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, Skeleton } from "@/components/ui";

type Run = { source: string; started_at: string; finished_at: string | null; imported: number; updated: number; skipped: number; ok: boolean | null };

export default function AdminPage() {
  const [state, setState] = useState<"loading" | "forbidden" | "ready">("loading");
  const [activeJobs, setActiveJobs] = useState(0);
  const [runs, setRuns] = useState<Run[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/overview");
    if (!r.ok) return setState("forbidden");
    const b = await r.json();
    setActiveJobs(b.activeJobs); setRuns(b.runs); setState("ready");
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function runImport() {
    setBusy(true); setMessage("");
    const r = await fetch("/api/admin/import-jobs", { method: "POST" });
    const b = await r.json().catch(() => ({}));
    setMessage(r.ok ? `Import finished: ${b.imported ?? 0} new, ${b.updated ?? 0} updated, ${b.skipped ?? 0} skipped.` : b.error ?? "Import failed.");
    setBusy(false);
    void load();
  }

  if (state === "loading") return <div className="tc-card"><Skeleton /></div>;
  if (state === "forbidden") return <EmptyState title="Admins only" body="Your account does not have admin access." />;
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section className="tc-hero"><h1>Admin</h1><p style={{ margin: 0, color: "var(--text-muted)" }}>Job sources and ingestion.</p></section>
      <section className="tc-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div><span className="tc-badge tc-tone-mint">Active jobs</span><p style={{ fontSize: "2rem", margin: "6px 0 0", fontFamily: "var(--font-display)" }}>{activeJobs}</p></div>
        <button type="button" className="tc-btn tc-btn-primary" onClick={runImport} disabled={busy}>{busy ? "Importing…" : "Run Greenhouse import"}</button>
      </section>
      {message && <p role="status" className="tc-badge tc-tone-sky">{message}</p>}
      <section className="tc-card">
        <h2>Recent ingestion runs</h2>
        {runs.length === 0 ? <p className="tc-hint">No runs recorded yet.</p> : (
          <table><thead><tr><th>Source</th><th>Started</th><th>New</th><th>Updated</th><th>Skipped</th><th>Result</th></tr></thead>
            <tbody>{runs.map((r) => <tr key={r.started_at + r.source}><td>{r.source}</td><td>{new Date(r.started_at).toLocaleString("en")}</td><td>{r.imported}</td><td>{r.updated}</td><td>{r.skipped}</td><td>{r.ok == null ? "Running" : r.ok ? "OK" : "Failed"}</td></tr>)}</tbody>
          </table>)}
      </section>
    </div>
  );
}
