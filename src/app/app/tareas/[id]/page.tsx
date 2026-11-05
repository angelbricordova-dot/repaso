import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/app/Icon";
import { Page } from "@/components/app/Page";
import { StatusPill } from "@/components/app/Pills";
import { RichText } from "@/components/app/RichText";
import { FileList } from "@/components/task/FileList";
import { Timeline } from "@/components/task/Timeline";
import { requireUser } from "@/lib/auth";
import { dueIn, formatDue } from "@/lib/format";
import { effectivePlan, PLANS } from "@/lib/plans";
import { LEVEL_LABEL, TASK_TYPE_LABEL } from "@/lib/tasks";
import type { Task, TaskMessage } from "@/lib/types";
import { StudentChat, StudentTaskActions } from "./StudentTask";

export const metadata = { title: "Tarea" };

export default async function TaskPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nueva?: string }> }) {
  const { id } = await params;
  const { nueva } = await searchParams;
  const { profile, supabase } = await requireUser();
  const { data: task } = await supabase.from("tasks").select("*").eq("id", id).eq("user_id", profile.id).maybeSingle<Task>();
  if (!task) notFound();
  const { data: msgs } = await supabase.from("task_messages").select("*").eq("task_id", id).order("created_at");
  const messages = (msgs ?? []) as TaskMessage[];

  const paths = [...task.files, ...task.delivery_files, ...messages.flatMap((m) => m.files)].map((f) => f.path);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from("tasks").createSignedUrls(paths, 3600);
    (data ?? []).forEach((d) => d.path && d.signedUrl && urls.set(d.path, d.signedUrl));
  }
  const plan = effectivePlan(profile.plan, profile.plan_expires_at);
  const revisionsAllowed = Math.max(plan.revisions, PLANS.basico.revisions);

  return (
    <Page>
      <Link href="/app/tareas" className="mb-5 inline-flex min-h-[44px] items-center gap-1 text-[14px] font-semibold text-ink-soft hover:text-marino">
        <Icon name="arrow-left" className="size-4" />
        Mis tareas
      </Link>

      {nueva && (
        <div className="mb-6 rounded-[16px] bg-hilo px-5 py-4 text-marino" role="status">
          <p className="font-[family-name:var(--font-display)] text-[20px] font-bold">¡Listo! Recibimos tu tarea n.º {task.number}.</p>
          <p className="mt-1 text-[15px]">Te avisamos aquí cuando alguien la tome. Si falta algo, te escribimos por el chat.</p>
        </div>
      )}

      <header className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="tape !min-h-[28px] !text-[13px]">Tarea n.º {task.number}</span>
          <StatusPill status={task.status} />
          {task.urgent && <span className="pill pill-urgent">Urgente</span>}
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-[26px] font-bold leading-[1.15] tracking-[-0.02em] md:text-[32px]">{task.title}</h1>
        <p className="text-[15px] text-ink-soft">
          {task.subject} · {TASK_TYPE_LABEL[task.task_type]} · {LEVEL_LABEL[task.level]} · Entrega {formatDue(task.due_at)}{" "}
          {!["entregada", "cerrada", "cancelada"].includes(task.status) && `(${dueIn(task.due_at)})`}
        </p>
      </header>

      <div className="mb-8">
        <Timeline task={task} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-8">
          {(task.status === "entregada" || task.status === "cerrada" || task.delivery_files.length > 0) && (
            <section aria-labelledby="entrega" className="rounded-[20px] bg-celeste-soft p-5">
              <h2 id="entrega" className="font-[family-name:var(--font-display)] text-[20px] font-bold">
                Tu tarea resuelta
              </h2>
              {task.delivery_note && <RichText text={task.delivery_note} className="prose-kit mt-2 text-[15.5px] leading-[1.6]" />}
              <div className="mt-4">
                <FileList files={task.delivery_files} urls={urls} />
              </div>
              <StudentTaskActions
                taskId={task.id}
                status={task.status}
                rating={task.rating}
                revisionsLeft={Math.max(0, revisionsAllowed - task.revision_requests)}
              />
            </section>
          )}

          <section aria-labelledby="chat">
            <h2 id="chat" className="mb-4 text-[17px] font-bold">
              Chat con el equipo
            </h2>
            <StudentChat taskId={task.id} userId={profile.id} messages={messages} urls={Object.fromEntries(urls)} disabled={task.status === "cancelada" || task.status === "cerrada"} />
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <section aria-labelledby="enviado" className="panel">
            <h2 id="enviado" className="text-[15px] font-bold">
              Lo que enviaste
            </h2>
            {task.instructions ? (
              <p className="mt-2 whitespace-pre-wrap text-[14.5px] leading-[1.55]">{task.instructions}</p>
            ) : (
              <p className="mt-2 text-[14px] text-ink-soft">Sin instrucciones escritas.</p>
            )}
            {task.files.length > 0 && (
              <div className="mt-3">
                <FileList files={task.files} urls={urls} />
              </div>
            )}
            {task.links.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1">
                {task.links.map((l) => (
                  <li key={l}>
                    <a href={l} target="_blank" rel="noopener noreferrer" className="block truncate text-[14px] font-medium text-marino-3 underline">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-[13px] text-ink-soft">
              Costó {task.cost} {task.cost === 1 ? "tarea" : "tareas"} {task.paid_with === "plan" ? "de tu plan" : task.cost === 1 ? "suelta" : "sueltas"}.
            </p>
          </section>
          {task.status === "recibida" && <StudentTaskActions taskId={task.id} status={task.status} rating={null} revisionsLeft={0} cancelOnly />}
        </aside>
      </div>
    </Page>
  );
}
