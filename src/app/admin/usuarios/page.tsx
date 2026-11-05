import { EmptyState, Page, TitleRow } from "@/components/app/Page";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { effectivePlan } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { LEVEL_LABEL } from "@/lib/tasks";
import type { Profile } from "@/lib/types";
import { UserControls } from "./UserControls";

export const metadata = { title: "Usuarios y equipo" };

export default async function UsersAdmin({ searchParams }: { searchParams: Promise<{ q?: string; rol?: string }> }) {
  const { user } = await requireAdmin();
  const { q, rol } = await searchParams;
  const db = createAdminClient();
  let query = db.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
  const term = (q ?? "").trim().replace(/[%,()]/g, "");
  if (term) query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%,institution.ilike.%${term}%,whatsapp.ilike.%${term}%`);
  if (rol === "equipo") query = query.in("role", ["staff", "admin"]);
  const { data } = await query;
  const users = (data ?? []) as Profile[];
  const ids = users.map((u) => u.id);
  const { data: tasks } = ids.length ? await db.from("tasks").select("user_id").in("user_id", ids) : { data: [] };
  const count = new Map<string, number>();
  ((tasks ?? []) as { user_id: string }[]).forEach((t) => count.set(t.user_id, (count.get(t.user_id) ?? 0) + 1));

  return (
    <Page wide>
      <TitleRow title="Usuarios y equipo" subtitle="Cambia planes, regala tareas o suma a alguien a tu equipo para que resuelva tareas." />
      <form className="mb-5 flex max-w-[560px] flex-wrap gap-2" role="search">
        <label htmlFor="q" className="sr-only">
          Buscar
        </label>
        <input id="q" name="q" defaultValue={q} className="field !h-11 min-w-0 flex-1" placeholder="Correo, nombre, liceo o WhatsApp" />
        <select name="rol" defaultValue={rol ?? ""} className="field !h-11 !w-auto" aria-label="Rol">
          <option value="">Todos</option>
          <option value="equipo">Solo equipo</option>
        </select>
        <button className="app-btn" type="submit">
          Buscar
        </button>
      </form>
      {users.length === 0 ? (
        <EmptyState>No encontramos usuarios.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {users.map((u) => {
            const plan = effectivePlan(u.plan, u.plan_expires_at);
            return (
              <li key={u.id} className="card grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-12 md:items-center">
                <div className="md:col-span-4">
                  <p className="text-[15px] font-semibold">
                    {u.full_name || "—"}{" "}
                    {u.role !== "student" && <span className="pill pill-progress ml-1 !h-5">{u.role === "admin" ? "Admin" : "Equipo"}</span>}
                  </p>
                  <p className="truncate text-[13.5px] text-ink-soft">{u.email}</p>
                  <p className="num text-[13.5px] text-ink-soft">{u.whatsapp || "Sin WhatsApp"}</p>
                </div>
                <div className="text-[14px] md:col-span-3">
                  <p>{[LEVEL_LABEL[u.level], u.institution].filter(Boolean).join(" · ")}</p>
                  <p className="text-[13px] text-ink-soft">
                    {count.get(u.id) ?? 0} tareas · desde {formatDate(u.created_at, { day: "numeric", month: "short", year: "2-digit" })}
                  </p>
                </div>
                <div className="md:col-span-5">
                  <UserControls
                    userId={u.id}
                    isSelf={u.id === user.id}
                    role={u.role}
                    plan={plan.id}
                    expires={plan.id === "gratis" ? null : u.plan_expires_at}
                    credits={u.credits}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
