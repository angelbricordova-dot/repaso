import { Shell, type NavGroup } from "@/components/app/Shell";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: { default: "Administración", template: "%s · Admin Repaso" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, supabase } = await requireAdmin();
  const [{ count: pendingPays }, { count: openReqs }] = await Promise.all([
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pendiente"),
    supabase.from("help_requests").select("id", { count: "exact", head: true }).in("status", ["recibido", "en_revision"]),
  ]);
  const groups: NavGroup[] = [
    {
      items: [
        { href: "/admin", label: "Resumen", icon: "home", exact: true },
        { href: "/admin/pagos", label: "Pagos por verificar", icon: "card", count: pendingPays ?? 0 },
        { href: "/admin/solicitudes", label: "Solicitudes", icon: "inbox", count: openReqs ?? 0 },
        { href: "/admin/usuarios", label: "Usuarios", icon: "users" },
        { href: "/admin/ajustes", label: "Tasa y datos de pago", icon: "settings" },
      ],
    },
    { label: "Volver", items: [{ href: "/app", label: "Mi Repaso", icon: "arrow-left", exact: true }] },
  ];
  return (
    <Shell groups={groups} scope={{ title: "Repaso", subtitle: "Administración" }} footer={<p className="px-3 text-[12px] text-soft">{profile.email}</p>}>
      {children}
    </Shell>
  );
}
