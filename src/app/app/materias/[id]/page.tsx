import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/app/Icon";
import { EmptyState, Page, TitleRow } from "@/components/app/Page";
import { KindIcon, StatusPill } from "@/components/app/Pills";
import { requireUser } from "@/lib/auth";
import { KIND_LABEL, timeAgo } from "@/lib/format";
import type { Material, Subject } from "@/lib/types";
import { EditSubject } from "../SubjectForms";

export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data: subject } = await supabase.from("subjects").select("*").eq("id", id).maybeSingle<Subject>();
  if (!subject) notFound();
  const { data } = await supabase
    .from("materials")
    .select("id, title, kind, status, created_at, kit, progress")
    .eq("subject_id", id)
    .order("created_at", { ascending: false });
  const mats = (data ?? []) as Pick<Material, "id" | "title" | "kind" | "status" | "created_at" | "kit" | "progress">[];

  return (
    <Page>
      <div className="mb-6">
        <Link href="/app/materias" className="inline-flex items-center gap-1 text-[13px] font-medium text-soft hover:text-text">
          <Icon name="arrow-left" className="size-3.5" />
          Materias
        </Link>
      </div>
      <TitleRow
        title={subject.name}
        subtitle={`${mats.length} ${mats.length === 1 ? "clase" : "clases"}`}
        actions={
          <Link href={`/app/subir?materia=${encodeURIComponent(subject.name)}`} className="app-btn">
            <Icon name="upload" />
            Subir clase
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="panel lg:col-span-8" aria-label="Clases de la materia">
          {mats.length === 0 ? (
            <EmptyState>Esta materia no tiene clases todavía.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {mats.map((m) => {
                const total = m.kit?.flashcards.length ?? 0;
                const known = Object.values(m.progress?.cards ?? {}).filter((b) => b >= 3).length;
                return (
                  <li key={m.id}>
                    <Link href={`/app/m/${m.id}`} className="card flex min-h-[63px] items-center gap-3 px-4 py-3 hover:border-control">
                      <KindIcon kind={m.kind} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium">{m.kit?.title || m.title}</p>
                        <p className="truncate text-[13px] text-soft">
                          {KIND_LABEL[m.kind]} · {timeAgo(m.created_at)}
                          {total ? ` · ${known} de ${total} fichas dominadas` : ""}
                          {typeof m.progress?.quiz_best === "number" ? ` · quiz ${m.progress.quiz_best}%` : ""}
                        </p>
                      </div>
                      <StatusPill status={m.status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <aside className="lg:col-span-4">
          <EditSubject id={subject.id} name={subject.name} examDate={subject.exam_date} />
        </aside>
      </div>
    </Page>
  );
}
