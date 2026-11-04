import { EmptyState, Page, TitleRow } from "@/components/app/Page";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";
import { effectivePlan } from "@/lib/plans";
import type { Profile } from "@/lib/types";
import { PlanSetter } from "./PlanSetter";

export const metadata = { title: "Usuarios" };

export default async function UsersAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q } = await searchParams;
  const db = createAdminClient();
  let query = db.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
  const term = (q ?? "").trim().replace(/[%,()]/g, "");
  if (term) query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%,university.ilike.%${term}%,career.ilike.%${term}%`);
  const { data } = await query;
  const users = (data ?? []) as Profile[];
  const ids = users.map((u) => u.id);
  const { data: mats } = ids.length ? await db.from("materials").select("user_id").in("user_id", ids).eq("status", "ready") : { data: [] };
  const count = new Map<string, number>();
  ((mats ?? []) as { user_id: string }[]).forEach((m) => count.set(m.user_id, (count.get(m.user_id) ?? 0) + 1));

  return (
    <Page wide>
      <TitleRow title="Usuarios" subtitle="Los 100 más recientes. Busca por correo, nombre, universidad o carrera." />
      <form className="mb-4 flex max-w-[480px] gap-2" role="search">
        <label htmlFor="q" className="sr-only">
          Buscar
        </label>
        <input id="q" name="q" defaultValue={q} className="field !h-10" placeholder="Buscar usuario…" />
        <button className="app-btn" type="submit">
          Buscar
        </button>
      </form>
      {users.length === 0 ? (
        <EmptyState>No encontramos usuarios.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-line">
          <table className="w-full min-w-[860px] text-[14px]">
            <thead>
              <tr className="border-b border-line text-left text-[12px] text-soft">
                <th className="px-4 py-3 font-normal">Usuario</th>
                <th className="px-4 py-3 font-normal">Universidad · carrera</th>
                <th className="px-4 py-3 text-right font-normal">Kits</th>
                <th className="px-4 py-3 font-normal">Registro</th>
                <th className="px-4 py-3 font-normal">Plan</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const plan = effectivePlan(u.plan, u.plan_expires_at);
                return (
                  <tr key={u.id} className="border-b border-rule last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {u.full_name || "—"} {u.role === "admin" && <span className="pill ml-1">Admin</span>}
                      </p>
                      <p className="text-[13px] text-soft">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">{[u.university, u.career].filter(Boolean).join(" · ") || <span className="text-soft">—</span>}</td>
                    <td className="num px-4 py-3 text-right">{count.get(u.id) ?? 0}</td>
                    <td className="px-4 py-3">{formatDate(u.created_at, { day: "numeric", month: "short", year: "2-digit" })}</td>
                    <td className="px-4 py-3">
                      <PlanSetter userId={u.id} plan={plan.id} expires={plan.id === "gratis" ? null : u.plan_expires_at} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
