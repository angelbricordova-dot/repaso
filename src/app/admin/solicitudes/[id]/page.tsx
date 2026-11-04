import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/app/Icon";
import { Page } from "@/components/app/Page";
import { RichText } from "@/components/app/RichText";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBytes, formatDate } from "@/lib/format";
import { PLANS } from "@/lib/plans";
import type { HelpRequest, Profile } from "@/lib/types";
import { RespondForm } from "./RespondForm";

export default async function RequestDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = createAdminClient();
  const { data } = await db.from("help_requests").select("*").eq("id", id).maybeSingle<HelpRequest>();
  if (!data) notFound();
  const r = data;
  const { data: u } = await db.from("profiles").select("*").eq("id", r.user_id).single<Profile>();
  const paths = [...r.files, ...r.response_files].map((f) => f.path);
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data: urls } = await db.storage.from("requests").createSignedUrls(paths, 3600);
    (urls ?? []).forEach((x) => x.path && x.signedUrl && signed.set(x.path, x.signedUrl));
  }

  return (
    <Page wide>
      <Link href="/admin/solicitudes" className="mb-6 inline-flex items-center gap-1 text-[13px] font-medium text-soft hover:text-text">
        <Icon name="arrow-left" className="size-3.5" />
        Solicitudes
      </Link>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <h1 className="text-[24px] font-semibold leading-[1.2] tracking-[-0.02em]">{r.topic}</h1>
          <p className="mt-1 text-[14px] text-soft">
            {r.subject} · enviado el {formatDate(r.created_at, { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}
          </p>

          {r.details && (
            <section className="mt-6">
              <h2 className="text-[14px] font-semibold">Lo que no entiende</h2>
              <p className="mt-2 max-w-[70ch] whitespace-pre-wrap text-[15px] leading-[1.6]">{r.details}</p>
            </section>
          )}
          {(r.files.length > 0 || r.links.length > 0) && (
            <section className="mt-6">
              <h2 className="text-[14px] font-semibold">Material enviado</h2>
              <ul className="mt-2 flex flex-col gap-2">
                {r.files.map((f) => (
                  <li key={f.path}>
                    <a href={signed.get(f.path)} target="_blank" rel="noopener" className="card flex items-center gap-3 px-4 py-3 hover:border-control">
                      <Icon name="download" className="size-4 text-soft" />
                      <span className="min-w-0 flex-1 truncate text-[14px]">{f.name}</span>
                      <span className="num text-[13px] text-soft">{formatBytes(f.size)}</span>
                    </a>
                  </li>
                ))}
                {r.links.map((l) => (
                  <li key={l}>
                    <a href={l} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-3 px-4 py-3 hover:border-control">
                      <Icon name="link" className="size-4 text-soft" />
                      <span className="min-w-0 flex-1 truncate text-[14px]">{l}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {r.admin_response && (
            <section className="mt-8 rounded-[16px] bg-panel p-5">
              <h2 className="text-[14px] font-semibold">Respuesta enviada · {formatDate(r.responded_at, { day: "numeric", month: "short" })}</h2>
              <RichText text={r.admin_response} className="prose-kit mt-2 text-[15px] leading-[1.6]" />
              {r.response_files.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1">
                  {r.response_files.map((f) => (
                    <li key={f.path}>
                      <a href={signed.get(f.path)} target="_blank" rel="noopener" className="text-[14px] font-medium underline underline-offset-4">
                        {f.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section className="mt-8">
            <h2 className="mb-3 text-[14px] font-semibold">{r.admin_response ? "Añadir a la respuesta" : "Responder"}</h2>
            <RespondForm id={r.id} studentId={r.user_id} status={r.status} initial={r.admin_response ?? ""} />
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="panel">
            <h2 className="text-[14px] font-semibold">Estudiante</h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[14px]">
              <dt className="text-soft">Nombre</dt>
              <dd>{u?.full_name || "—"}</dd>
              <dt className="text-soft">Correo</dt>
              <dd className="break-all">{u?.email}</dd>
              <dt className="text-soft">Universidad</dt>
              <dd>{u?.university || "—"}</dd>
              <dt className="text-soft">Carrera</dt>
              <dd>{u?.career || "—"}</dd>
              <dt className="text-soft">Semestre</dt>
              <dd>{u?.semester || "—"}</dd>
              <dt className="text-soft">WhatsApp</dt>
              <dd>
                {u?.phone ? (
                  <a className="underline underline-offset-4" href={`https://wa.me/${u.phone.replace(/\D/g, "").replace(/^0/, "58")}`} target="_blank" rel="noopener">
                    {u.phone}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
              <dt className="text-soft">Plan</dt>
              <dd>{PLANS[(u?.plan ?? "gratis") as keyof typeof PLANS]?.name}</dd>
              <dt className="text-soft">Examen</dt>
              <dd>{r.exam_date ? formatDate(r.exam_date + "T12:00:00Z", { day: "numeric", month: "long" }) : "—"}</dd>
            </dl>
          </section>
        </aside>
      </div>
    </Page>
  );
}
