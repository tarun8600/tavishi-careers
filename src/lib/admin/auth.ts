import { timingSafeEqual } from "node:crypto";
import { createServerSupabase } from "@/lib/supabase/server";

export function bearerMatches(received: string | null, secret: string | undefined): boolean {
  if (!received || !secret) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Returns the signed-in user's id if they are listed in admin_users (RLS: self-read only). */
export async function currentAdminId(): Promise<string | null> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  return data ? user.id : null;
}
