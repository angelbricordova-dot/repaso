import { Page, TitleRow } from "@/components/app/Page";
import { requireUser } from "@/lib/auth";
import { effectivePlan, startOfMonthIso } from "@/lib/plans";
import type { Level } from "@/lib/types";
import { NewTaskForm } from "./NewTaskForm";

export const metadata = { title: "Nueva tarea" };

export default async function NewTaskPage({ searchParams }: { searchParams: Promise<{ nivel?: string; materia?: string; entrega?: string }> }) {
  const { profile, supabase } = await requireUser();
  const sp = await searchParams;
  const plan = effectivePlan(profile.plan, profile.plan_expires_at);
  const { data } = await supabase
    .from("tasks")
    .select("cost, subject")
    .eq("user_id", profile.id)
    .eq("paid_with", "plan")
    .neq("status", "cancelada")
    .gte("created_at", startOfMonthIso());
  const used = (data ?? []).reduce((a, t) => a + (t.cost as number), 0);
  const { data: recent } = await supabase.from("tasks").select("subject").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(30);
  const subjects = [...new Set((recent ?? []).map((r) => r.subject as string))].slice(0, 8);
  const level = (["bachillerato", "diversificado", "universidad"].includes(sp.nivel ?? "") ? sp.nivel : profile.level) as Level;
  const due = sp.entrega && !Number.isNaN(Date.parse(sp.entrega)) ? sp.entrega : null;

  return (
    <Page>
      <TitleRow title="Nueva tarea" subtitle="Mientras más claro el enunciado, mejor queda. Una foto nítida basta." />
      <NewTaskForm
        userId={profile.id}
        initial={{ level, subject: sp.materia?.slice(0, 80) ?? "", dueAt: due }}
        recentSubjects={subjects}
        planLeft={Math.max(0, plan.tasksPerMonth - used)}
        credits={profile.credits}
        planName={plan.id === "gratis" ? null : plan.name}
        allowUrgent={plan.urgent}
        minHours={plan.minHours}
      />
    </Page>
  );
}
