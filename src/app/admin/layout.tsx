import { Shell, type NavGroup, type NavItem } from "@/components/app/Shell";
import { requireStaff } from "@/lib/auth";

export const metadata = { title: { default: "Panel del equipo", template: "%s · Panel" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, supabase } = await requireStaff();
  const isAdmin = profile.role === "admin";
  const [{ count: todo }, { count: pays }] = await Promise.all([
    supabase.from("tasks").select("id", { count: "exact", head: true }).in("status", ["recibida", "corrigiendo"]),
    isAdmin ? supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pendiente") : Promise.resolve({ count: 0 }),
  ]);
  const groups: NavGroup[] = [
    {
      items: [
        ...(isAdmin ? [{ href: "/admin", label: "Resumen", icon: "home" as const, exact: true }] : []),
        { href: "/admin/tareas", label: "Cola de tareas", icon: "inbox", count: todo ?? 0 },
        ...(isAdmin
          ? [
              { href: "/admin/pagos", label: "Pagos por verificar", icon: "card" as const, count: pays ?? 0 },
              { href: "/admin/usuarios", label: "Usuarios y equipo", icon: "users" as const },
              { href: "/admin/ajustes", label: "Tasa y datos de pago", icon: "settings" as const },
            ]
          : []),
      ],
    },
    { label: "Volver", items: [{ href: "/app", label: "Mi cuenta", icon: "arrow-left", exact: true }] },
  ];
  const tabs: NavItem[] = isAdmin
    ? [
        { href: "/admin", label: "Resumen", icon: "home", exact: true },
        { href: "/admin/tareas", label: "Cola", icon: "inbox", count: todo ?? 0 },
        { href: "/admin/pagos", label: "Pagos", icon: "card", count: pays ?? 0 },
      ]
    : [
        { href: "/admin/tareas", label: "Cola", icon: "inbox", count: todo ?? 0 },
        { href: "/app", label: "Mi cuenta", icon: "user", exact: true },
        { href: "/app/perfil", label: "Perfil", icon: "settings" },
      ];
  return (
    <Shell groups={groups} tabs={tabs} scope={isAdmin ? "Administración" : "Equipo"} footer={<p className="truncate px-3 py-2 text-[13px] text-ink-soft">{profile.email}</p>}>
      {children}
    </Shell>
  );
}
