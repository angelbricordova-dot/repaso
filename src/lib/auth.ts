import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

function adminEmails(): string[] {
  return (process.env.REPASO_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Usuario y perfil de la petición actual (memorizado por petición). */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null, supabase } as const;

  let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();

  // Si el trigger no creó el perfil (proyecto viejo), lo creamos con la service role.
  if (!profile) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .upsert({ id: user.id, email: user.email ?? "", full_name: (user.user_metadata?.full_name as string) ?? "" })
      .select("*")
      .single<Profile>();
    profile = data;
  }

  // Asigna rol admin a los correos configurados.
  if (profile && profile.role !== "admin" && adminEmails().includes((user.email ?? "").toLowerCase())) {
    const admin = createAdminClient();
    const { data } = await admin.from("profiles").update({ role: "admin" }).eq("id", user.id).select("*").single<Profile>();
    if (data) profile = data;
  }

  return { user, profile, supabase } as const;
});

export async function requireUser() {
  const s = await getSession();
  if (!s.user || !s.profile) redirect("/entrar");
  return { user: s.user, profile: s.profile, supabase: s.supabase };
}

export async function requireAdmin() {
  const s = await requireUser();
  if (s.profile.role !== "admin") redirect("/app");
  return s;
}
