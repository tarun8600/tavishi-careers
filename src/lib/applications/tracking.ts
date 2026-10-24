export const STATUSES = ["draft", "ready", "approved", "submitted", "external_pending", "interview", "offer", "rejected", "withdrawn", "failed"] as const;
export type Status = (typeof STATUSES)[number];

/**
 * Transitions a user may record themselves after an application left Tavishi.
 * Submission itself (approved → submitted) is never user-settable here; it is only recorded by a verified integration.
 */
const USER_TRACKABLE: Partial<Record<Status, Status[]>> = {
  external_pending: ["interview", "rejected", "withdrawn"],
  submitted: ["interview", "rejected", "withdrawn"],
  interview: ["interview", "offer", "rejected", "withdrawn"],
  offer: ["withdrawn"],
};

export function canTrack(from: Status, to: Status): boolean {
  return USER_TRACKABLE[from]?.includes(to) ?? false;
}

export type TrackingInput = { status: Status; note: string | null; interview_at: string | null; follow_up_at: string | null };

export function parseTrackingInput(raw: unknown, now = new Date()): { ok: true; value: TrackingInput } | { ok: false; error: string } {
  const b = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (typeof b.status !== "string" || !(STATUSES as readonly string[]).includes(b.status)) return { ok: false, error: "Invalid status" };
  const note = typeof b.note === "string" ? b.note.trim().slice(0, 1000) || null : null;
  const date = (v: unknown) => {
    if (v == null || v === "") return null;
    const d = new Date(String(v));
    return Number.isNaN(d.getTime()) ? undefined : d;
  };
  const interview = date(b.interview_at);
  const follow = date(b.follow_up_at);
  if (interview === undefined || follow === undefined) return { ok: false, error: "Invalid date" };
  if (follow && follow.getTime() < now.getTime() - 60_000) return { ok: false, error: "Follow-up reminder must be in the future" };
  return { ok: true, value: { status: b.status as Status, note, interview_at: interview?.toISOString() ?? null, follow_up_at: follow?.toISOString() ?? null } };
}

export type AppRow = { status: string; follow_up_at?: string | null };

/** Funnel counts computed only from real rows. */
export function summarize(rows: AppRow[], now = new Date()) {
  const count = (s: string[]) => rows.filter((r) => s.includes(r.status)).length;
  return {
    total: rows.length,
    preparing: count(["draft", "ready"]),
    approved: count(["approved"]),
    sent: count(["submitted", "external_pending", "interview", "offer", "rejected"]),
    interviews: count(["interview", "offer"]),
    offers: count(["offer"]),
    followUpsDue: rows.filter((r) => r.follow_up_at && new Date(r.follow_up_at) <= now && !["rejected", "withdrawn", "offer"].includes(r.status)).length,
  };
}
