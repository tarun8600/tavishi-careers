export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const RESUME_TYPES: Record<string, "pdf" | "docx"> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export type ResumeFileCheck = { ok: true; ext: "pdf" | "docx" } | { ok: false; error: string };

/** Validates an upload before it is sent to storage (the bucket enforces the same limits server-side). */
export function checkResumeFile(f: { name: string; type: string; size: number }): ResumeFileCheck {
  const ext = RESUME_TYPES[f.type];
  if (!ext) return { ok: false, error: "Upload a PDF or Word (.docx) file." };
  if (!f.name.toLowerCase().endsWith(`.${ext}`)) return { ok: false, error: "File extension does not match its type." };
  if (f.size <= 0) return { ok: false, error: "The file is empty." };
  if (f.size > MAX_RESUME_BYTES) return { ok: false, error: "Resumes must be 5 MB or smaller." };
  return { ok: true, ext };
}

export function resumeStoragePath(userId: string, id: string, ext: string): string {
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid id");
  return `${userId}/${id}.${ext}`;
}

export function cleanLabel(label: string): string | null {
  const v = label.replace(/\s+/g, " ").trim().slice(0, 80);
  return v || null;
}
