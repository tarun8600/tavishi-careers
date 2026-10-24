export type Tone = "mint" | "sky" | "lavender" | "peach" | "yellow" | "danger";
const MAP: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "lavender" },
  ready: { label: "Ready for review", tone: "sky" },
  approved: { label: "Approved", tone: "mint" },
  submitted: { label: "Submitted", tone: "mint" },
  external_pending: { label: "Apply on employer site", tone: "yellow" },
  interview: { label: "Interview", tone: "sky" },
  offer: { label: "Offer", tone: "mint" },
  rejected: { label: "Not selected", tone: "peach" },
  withdrawn: { label: "Withdrawn", tone: "peach" },
  failed: { label: "Failed", tone: "danger" },
};
export function statusMeta(status: string) {
  return MAP[status] ?? { label: "Unknown", tone: "lavender" as Tone };
}
export const APPLICATION_STATUSES = Object.keys(MAP);
