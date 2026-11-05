import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/app/Icon";
import { Page } from "@/components/app/Page";
import { StatusPill } from "@/components/app/Pills";
import { RichText } from "@/components/app/RichText";
import { FileList } from "@/components/task/FileList";
import { Timeline } from "@/components/task/Timeline";
import { requireStaff } from "@/lib/auth";
import { BRAND, SITE_URL } from "@/lib/brand";
import { dueIn, formatDue, isPast } from "@/lib/format";
import { waLink } from "@/lib/legal";
import { effectivePlan } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { LEVEL_LABEL, TASK_TYPE_LABEL } from "@/lib/tasks";
import type { Profile, Task, TaskMessage } from "@/lib/types";
import { DeliverForm, StaffChat, StatusControls } from "./StaffTask";

export default async function StaffTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireStaff();
  const { id } = await params;
  const db = createAdminClient();
  const { data: task } = await db.from("tasks").select("*").eq("id", id).maybeSingle<Task>();
  if (!task) notFound();
  const [{ data: student }, { data: msgs }] = await Promise.all([
    db.from("profiles").select("*").eq("id", task.user_id).single<Profile>(),
    db.from("task_messages").select("*").eq("task_id", id).order("created_at"),
  ]);
  const messages = (msgs ?? []) as TaskMessage[];
  const paths = [...task.files, ...task.delivery_files, ...messages.flatMap((m) => m.files)].map((f) => f.path);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data } = await db.storage.from("tasks").createSignedUrls(paths, 3600);
    (data ?? []).forEach((d) => d.path && d.signedUrl && urls.set(d.path, d.signedUrl));
  }
  const assignee = task.assigned_to ? (await db.from("profiles").select("full_name, email").eq("id", task.assigned_to).single()).data : null;
  const plan = student ? effectivePlan(student.plan, student.plan_expires_at) : null;
  const first = (student?.full_name || "").split(" ")[0] || "";
  const link = `${SITE_URL}/app/tareas/${task.id}`;
  const waDone = student?.whatsapp ? waLink(student.whatsapp, `Hola ${first}, tu tarea n.º ${task.number} (${task.title}) ya está lista en ${BRAND}: ${link}`) : null;
  const waInfo = student?.whatsapp ? waLink(student.whatsapp, `Hola ${first}, te escribimos de ${BRAND} por tu tarea n.º ${task.number}. Te dejamos una pregunta en el chat: ${link}`) : null;

  return (
    <Page wide>
      <Link href="/admin/tareas" className="mb-5 inline-flex min-h-[44px] items-center gap-1 text-[14px] font-semibold text-ink-soft hover:text-marino">
        <Icon name="arrow-left" className="size-4" />
        Cola de tareas
      </Link>
      <header className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="tape !min-h-[28px] !text-[13px]">Tarea n.º {task.number}</span>
          <StatusPill status={task.status} />
          {task.urgent && <span className="pill pill-urgent">Urgente</span>}
          {task.revision_requests > 0 && <span className="pill pill-attention">{task.revision_requests} corrección(es) pedida(s)</span>}
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-[26px] font-bold leading-[1.15] tracking-[-0.02em] md:text-[32px]">{task.title}</h1>
        <p className="text-[15px] text-ink-soft">
          {task.subject} · {TASK_TYPE_LABEL[task.task_type]} · {LEVEL_LABEL[task.level]} ·{" "}
          <strong className={isPast(task.due_at) ? "text-rojo" : "text-marino"}>
            Entrega {formatDue(task.due_at)}
            {!["entregada", "cerrada", "cancelada"].includes(task.status) && ` (${dueIn(task.due_at)})`}
          </strong>
        </p>
      </header>

      <div className="mb-8">
        <Timeline task={task} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-8">
          <section aria-labelledby="enunciado" className="panel">
            <h2 id="enunciado" className="text-[17px] font-bold">
              Enunciado
            </h2>
            {task.instructions ? <p className="mt-2 whitespace-pre-wrap text-[15px] leading-[1.6]">{task.instructions}</p> : <p className="mt-2 text-[14px] text-ink-soft">Sin instrucciones escritas.</p>}
            {task.files.length > 0 && (
              <div className="mt-4">
                <FileList files={task.files} urls={urls} />
              </div>
            )}
            {task.links.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1">
                {task.links.map((l) => (
                  <li key={l}>
                    <a href={l} target="_blank" rel="noopener noreferrer" className="block truncate text-[14px] font-semibold text-marino-3 underline">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="entregar" className="rounded-[20px] bg-celeste-soft p-5">
            <h2 id="entregar" className="font-[family-name:var(--font-display)] text-[20px] font-bold">
              {task.delivered_at ? "Entrega" : "Entregar"}
            </h2>
            {task.delivery_note && <RichText text={task.delivery_note} className="prose-kit mt-2 text-[15px] leading-[1.6]" />}
            {task.delivery_files.length > 0 && (
              <div className="mt-3">
                <FileList files={task.delivery_files} urls={urls} />
              </div>
            )}
            {task.status !== "cancelada" && task.status !== "cerrada" && (
              <DeliverForm taskId={task.id} studentId={task.user_id} hasDelivery={task.delivery_files.length > 0} initialNote={task.delivery_note ?? ""} />
            )}
            {task.rating && (
              <p className="mt-4 text-[14.5px]">
                El estudiante calificó con <strong>{task.rating} de 5</strong>
                {task.rating_comment ? `: «${task.rating_comment}»` : "."}
              </p>
            )}
          </section>

          <section aria-labelledby="chat">
            <h2 id="chat" className="mb-4 text-[17px] font-bold">
              Chat con el estudiante
            </h2>
            <StaffChat taskId={task.id} studentId={task.user_id} messages={messages} urls={Object.fromEntries(urls)} disabled={task.status === "cancelada"} />
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-8 lg:self-start">
          <StatusControls taskId={task.id} status={task.status} assignedToMe={task.assigned_to === user.id} assigneeName={assignee ? (assignee.full_name || assignee.email).split(" ")[0] : null} />
          <section aria-labelledby="estudiante" className="panel">
            <h2 id="estudiante" className="text-[15px] font-bold">
              Estudiante
            </h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[14px]">
              <dt className="text-ink-soft">Nombre</dt>
              <dd>{student?.full_name || "—"}</dd>
              <dt className="text-ink-soft">Nivel</dt>
              <dd>{student ? LEVEL_LABEL[student.level] : "—"}</dd>
              <dt className="text-ink-soft">Institución</dt>
              <dd>{student?.institution || "—"}</dd>
              <dt className="text-ink-soft">Plan</dt>
              <dd>{plan?.id === "gratis" ? "Sin plan" : plan?.name}</dd>
              <dt className="text-ink-soft">WhatsApp</dt>
              <dd className="num">{student?.whatsapp || "—"}</dd>
            </dl>
            {waDone && (
              <div className="mt-4 flex flex-col gap-2">
                <a href={waDone} target="_blank" rel="noopener" className="app-btn w-full">
                  <Icon name="whatsapp" />
                  Avisar que está lista
                </a>
                <a href={waInfo!} target="_blank" rel="noopener" className="app-btn app-btn-secondary w-full">
                  Avisar que hay una pregunta
                </a>
              </div>
            )}
          </section>
        </aside>
      </div>
    </Page>
  );
}
