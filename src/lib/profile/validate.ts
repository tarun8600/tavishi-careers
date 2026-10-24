export const WORKPLACE_TYPES = ["remote", "hybrid", "onsite", "any"] as const;
export type WorkplaceType = (typeof WORKPLACE_TYPES)[number];

export type ProfileInput = {
  full_name: string;
  headline: string | null;
  skills: string[];
  country_code: string | null;
  city: string | null;
  preferred_workplace: WorkplaceType;
};

export type ValidationResult =
  | { ok: true; value: ProfileInput }
  | { ok: false; errors: Record<string, string> };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function validateProfileInput(raw: unknown): ValidationResult {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};

  const full_name = str(body.full_name);
  if (!full_name) errors.full_name = "Full name is required";
  else if (full_name.length > 120) errors.full_name = "Full name must be 120 characters or fewer";

  const headline = str(body.headline);
  if (headline.length > 160) errors.headline = "Headline must be 160 characters or fewer";

  const rawSkills = Array.isArray(body.skills) ? body.skills : str(body.skills).split(",");
  const skills = [...new Set(rawSkills.map(str).filter(Boolean))];
  if (skills.length > 50) errors.skills = "At most 50 skills";
  else if (skills.some((s) => s.length > 50)) errors.skills = "Each skill must be 50 characters or fewer";

  const country = str(body.country_code).toUpperCase();
  if (country && !/^[A-Z]{2}$/.test(country)) errors.country_code = "Use a 2-letter ISO country code";

  const city = str(body.city);
  if (city.length > 100) errors.city = "City must be 100 characters or fewer";

  const wp = str(body.preferred_workplace) || "any";
  if (!(WORKPLACE_TYPES as readonly string[]).includes(wp)) errors.preferred_workplace = "Invalid workplace type";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      full_name,
      headline: headline || null,
      skills,
      country_code: country || null,
      city: city || null,
      preferred_workplace: wp as WorkplaceType,
    },
  };
}
