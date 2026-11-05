import { Icon } from "@/components/app/Icon";
import { Shell, type NavGroup, type NavItem } from "@/components/app/Shell";
import { requireUser } from "@/lib/auth";
import { effectivePlan } from "@/lib/plans";
import { LEVEL_LABEL } from "@/lib/tasks";

export const metadata = { title: "Mis tareas" };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, supabase } = await requireUser();
  const plan = effectivePlan(profile.plan, profile.plan_expires_at);
  const { count: waiting } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .in("status", ["necesita_info", "entregada"]);

  const groups: NavGroup[] = [
    {
      items: [
        { href: "/app", label: "Inicio", icon: "home", exact: true },
        { href: "/app/nueva", label: "Nueva tarea", icon: "plus" },
        { href: "/app/tareas", label: "Mis tareas", icon: "list", count: waiting ?? 0 },
      ],
    },
    {
      label: "Cuenta",
      items: [
        { href: "/app/plan", label: "Plan y pagos", icon: "card" },
        { href: "/app/invitar", label: "Invitar y ganar", icon: "gift" },
        { href: "/app/perfil", label: "Perfil", icon: "user" },
        ...(profile.role !== "student" ? [{ href: "/admin/tareas", label: "Panel del equipo", icon: "shield" as const }] : []),
      ],
    },
  ];
  const tabs: NavItem[] = [
    { href: "/app", label: "Inicio", icon: "home", exact: true },
    { href: "/app/nueva", label: "Nueva", icon: "plus" },
    { href: "/app/tareas", label: "Tareas", icon: "list", count: waiting ?? 0 },
  ];

  const name = profile.full_name || profile.email.split("@")[0];
  const footer = (
    <div className="flex items-center gap-3 px-2 py-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-celeste text-[14px] font-bold text-marino">{name.slice(0, 1).toUpperCase()}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold">{name}</p>
        <p className="truncate text-[12.5px] text-ink-soft">
          {plan.id === "gratis" ? "Sin plan" : `Plan ${plan.name}`} · {profile.credits} {profile.credits === 1 ? "tarea suelta" : "tareas sueltas"}
        </p>
      </div>
      <form action="/auth/salir" method="post">
        <button type="submit" className="grid size-10 place-items-center rounded-[10px] text-ink-soft hover:bg-surface" title="Cerrar sesión">
          <Icon name="logout" />
          <span className="sr-only">Cerrar sesión</span>
        </button>
      </form>
    </div>
  );

  const scope = [LEVEL_LABEL[profile.level], profile.institution].filter(Boolean).join(" · ");
  return (
    <Shell groups={groups} tabs={tabs} footer={footer} scope={scope}>
      {children}
    </Shell>
  );
}
