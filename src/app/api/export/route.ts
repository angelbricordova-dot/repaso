import { getSession } from "@/lib/auth";

// Exporta todos los datos del usuario (derecho de acceso a sus datos).
export async function GET() {
  const { user, profile, supabase } = await getSession();
  if (!user || !profile) return new Response("No autorizado", { status: 401 });
  const [subjects, materials, tutor, requests, payments] = await Promise.all([
    supabase.from("subjects").select("*").eq("user_id", user.id),
    supabase.from("materials").select("id, title, kind, subject_id, status, kit, progress, source_text, created_at, processed_at").eq("user_id", user.id),
    supabase.from("tutor_messages").select("material_id, role, content, created_at").eq("user_id", user.id),
    supabase.from("help_requests").select("*").eq("user_id", user.id),
    supabase.from("payments").select("*").eq("user_id", user.id),
  ]);
  const body = JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      profile,
      subjects: subjects.data ?? [],
      materials: materials.data ?? [],
      tutor_messages: tutor.data ?? [],
      help_requests: requests.data ?? [],
      payments: payments.data ?? [],
    },
    null,
    2,
  );
  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="repaso-mis-datos-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
