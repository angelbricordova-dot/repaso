import { Shell, type NavGroup } from "@/components/app/Shell";
import { Icon } from "@/components/app/Icon";
import { requireUser } from "@/lib/auth";
import { effectivePlan } from "@/lib/plans";

export const metadata = { title: "Mi Repaso" };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, supabase } = await requireUser();
  const plan = effectivePlan(profile.plan, profile.plan_expires_at);

  const { count: answered } = await supabase
    .from("help_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("status", "respondido");

  const groups: NavGroup[] = [
    {
      items: [
        { href: "/app", label: "Inicio", icon: "home", exact: true },
        { href: "/app/subir", label: "Subir clase", icon: "upload" },
        { href: "/app/materias", label: "Materias", icon: "book" },
        { href: "/app/ayuda", label: "Pide una explicación", icon: "help", count: answered ?? 0 },
      ],
    },
    {
      label: "Cuenta",
      items: [
        { href: "/app/plan", label: "Plan y pagos", icon: "card" },
        { href: "/app/perfil", label: "Perfil", icon: "user" },
        ...(profile.role === "admin" ? [{ href: "/admin", label: "Administración", icon: "shield" as const }] : []),
      ],
    },
  ];

  const name = profile.full_name || profile.email.split("@")[0];
  const footer = (
    <div className="flex items-center gap-3 rounded-[12px] px-2 py-2">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-data-soft text-[13px] font-semibold text-[#6a0f31]">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{name}</p>
        <p className="truncate text-[12px] text-soft">Plan {plan.name}</p>
      </div>
      <form action="/auth/salir" method="post">
        <button type="submit" className="grid size-9 place-items-center rounded-[10px] text-soft hover:bg-panel" title="Cerrar sesión">
          <Icon name="logout" />
          <span className="sr-only">Cerrar sesión</span>
        </button>
      </form>
    </div>
  );

  const scope = {
    title: profile.university || "Repaso",
    subtitle: profile.career || "Completa tu carrera en Perfil",
  };

  return (
    <Shell groups={groups} footer={footer} scope={scope}>
      {children}
    </Shell>
  );
}
