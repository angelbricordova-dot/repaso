import { getSession } from "@/lib/auth";

// Exporta todos los datos del usuario (derecho de acceso a sus datos).
export async function GET() {
  const { user, profile, supabase } = await getSession();
  if (!user || !profile) return new Response("No autorizado", { status: 401 });
  const [tasks, payments] = await Promise.all([
    supabase.from("tasks").select("*").eq("user_id", user.id),
    supabase.from("payments").select("*").eq("user_id", user.id),
  ]);
  const ids = (tasks.data ?? []).map((t) => t.id);
  const messages = ids.length ? await supabase.from("task_messages").select("*").in("task_id", ids) : { data: [] };
  const body = JSON.stringify({ exported_at: new Date().toISOString(), profile, tasks: tasks.data ?? [], messages: messages.data ?? [], payments: payments.data ?? [] }, null, 2);
  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="mis-datos-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
