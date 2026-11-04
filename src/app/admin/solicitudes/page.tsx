import Link from "next/link";
import { EmptyState, Page, TitleRow } from "@/components/app/Page";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, timeAgo } from "@/lib/format";
import { PLANS } from "@/lib/plans";
import type { HelpRequest, Profile } from "@/lib/types";

export const metadata = { title: "Solicitudes" };

const VIEWS = [
  { id: "abiertas", label: "Abiertas", statuses: ["recibido", "en_revision"] },
  { id: "respondidas", label: "Respondidas", statuses: ["respondido"] },
  { id: "cerradas", label: "Cerradas", statuses: ["cerrado"] },
] as const;

export default async function RequestsAdmin({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  await requireAdmin();
  const { vista } = await searchParams;
  const view = VIEWS.find((v) => v.id === vista) ?? VIEWS[0];
  const db = createAdminClient();
  const { data } = await db
    .from("help_requests")
    .select("*")
    .in("status", [...view.statuses])
    .order("created_at", { ascending: view.id === "abiertas" })
    .limit(200);
  const reqs = (data ?? []) as HelpRequest[];
  const ids = [...new Set(reqs.map((r) => r.user_id))];
  const { data: profs } = ids.length ? await db.from("profiles").select("id, email, full_name, plan, university").in("id", ids) : { data: [] };
  const who = new Map(((profs ?? []) as Pick<Profile, "id" | "email" | "full_name" | "plan" | "university">[]).map((p) => [p.id, p]));
  // Repaso+ primero (respuesta prioritaria), luego por fecha de examen más cercana.
  if (view.id === "abiertas") {
    reqs.sort((a, b) => {
      const pa = who.get(a.user_id)?.plan === "repaso_plus" ? 0 : 1;
      const pb = who.get(b.user_id)?.plan === "repaso_plus" ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return (a.exam_date ?? "9999").localeCompare(b.exam_date ?? "9999");
    });
  }

  return (
    <Page wide>
      <TitleRow title="Solicitudes" subtitle="Clases que los estudiantes no entendieron. Repaso+ va primero, luego el examen más cercano." />
      <div className="mb-4 flex gap-1 border-b border-line">
        {VIEWS.map((v) => (
          <Link
            key={v.id}
            href={`/admin/solicitudes?vista=${v.id}`}
            className={`relative h-10 px-3 text-[14px] font-medium leading-10 ${v.id === view.id ? "text-text" : "text-soft hover:text-text"}`}
          >
            {v.label}
            {v.id === view.id && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-text" />}
          </Link>
        ))}
      </div>
      {reqs.length === 0 ? (
        <EmptyState>No hay solicitudes {view.label.toLowerCase()}.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {reqs.map((r) => {
            const u = who.get(r.user_id);
            return (
              <li key={r.id}>
                <Link href={`/admin/solicitudes/${r.id}`} className="card flex min-h-[72px] items-center gap-4 px-4 py-3 hover:border-control">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className={`truncate text-[14px] ${r.status === "recibido" ? "font-semibold" : "font-medium"}`}>{u?.full_name || u?.email}</p>
                      <span className="shrink-0 text-[13px] text-soft">{timeAgo(r.created_at)}</span>
                    </div>
                    <p className="truncate text-[14px]">
                      {r.subject}: {r.topic}
                    </p>
                    <p className="truncate text-[13px] text-soft">
                      {[u?.university, PLANS[(u?.plan ?? "gratis") as keyof typeof PLANS]?.name, r.files.length ? `${r.files.length} archivos` : null, r.links.length ? `${r.links.length} enlaces` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {r.exam_date && <span className="pill pill-data shrink-0">Examen {formatDate(r.exam_date + "T12:00:00Z", { day: "numeric", month: "short" })}</span>}
                  {r.status === "en_revision" && <span className="pill pill-warning shrink-0">En revisión</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
