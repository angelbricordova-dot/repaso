import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/app/Icon";
import { Page } from "@/components/app/Page";
import { StatusPill } from "@/components/app/Pills";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMinutes, KIND_LABEL } from "@/lib/format";
import { effectivePlan } from "@/lib/plans";
import type { Material, Subject } from "@/lib/types";
import { MaterialActions } from "./MaterialActions";
import { Pending } from "./Pending";
import { StudyView } from "./StudyView";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("materials").select("title, kit").eq("id", id).maybeSingle();
  return { title: (data?.kit as Material["kit"])?.title || data?.title || "Material" };
}

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, supabase } = await requireUser();
  const { data } = await supabase.from("materials").select("*").eq("id", id).maybeSingle<Material>();
  if (!data) notFound();
  const m = data;

  const [{ data: subjects }, { data: messages }] = await Promise.all([
    supabase.from("subjects").select("*").eq("user_id", profile.id).order("name"),
    supabase.from("tutor_messages").select("id, role, content").eq("material_id", id).order("created_at", { ascending: true }).limit(100),
  ]);
  const subs = (subjects ?? []) as Subject[];
  const subject = subs.find((s) => s.id === m.subject_id);
  const plan = effectivePlan(profile.plan, profile.plan_expires_at);
  const asked = (messages ?? []).filter((x) => x.role === "user").length;

  return (
    <Page>
      <div className="mb-6">
        <Link href={subject ? `/app/materias/${subject.id}` : "/app"} className="inline-flex items-center gap-1 text-[13px] font-medium text-soft hover:text-text">
          <Icon name="arrow-left" className="size-3.5" />
          {subject ? subject.name : "Inicio"}
        </Link>
      </div>

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-[24px] font-semibold leading-[1.2] tracking-[-0.02em]">{m.kit?.title || m.title}</h1>
          <p className="mt-1 text-[14px] text-soft">
            {[KIND_LABEL[m.kind], m.duration_seconds ? formatMinutes(m.duration_seconds) : null, `Subido el ${formatDate(m.created_at, { day: "numeric", month: "long" })}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {m.kit?.one_line && <p className="mt-3 max-w-[70ch] text-[15px] leading-[1.5]">{m.kit.one_line}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill status={m.status} />
          <MaterialActions id={m.id} title={m.title} subjectId={m.subject_id} subjects={subs} />
        </div>
      </div>

      {m.status === "ready" && m.kit ? (
        <StudyView
          materialId={m.id}
          kit={m.kit}
          progress={m.progress ?? {}}
          initialMessages={(messages ?? []) as { id: string; role: "user" | "assistant"; content: string }[]}
          tutorLimit={plan.tutorQuestionsPerMaterial}
          tutorUsed={asked}
        />
      ) : (
        <Pending id={m.id} status={m.status} error={m.error} kind={m.kind} startedAt={m.processing_started_at} />
      )}
    </Page>
  );
}
