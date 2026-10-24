/** Returns a same-origin relative path, or the fallback. Blocks open redirects. */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next) || next.includes("\\")) return fallback;
  return next.length > 512 ? fallback : next;
}

export const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/resumes", "/applications", "/saved-jobs", "/onboarding"];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
