import { BRAND } from "@/lib/brand";

/** El parche bordado con el nombre: costura punteada en hilo dorado. */
export function Logo({ size = 20, tone = "dark" }: { size?: number; tone?: "dark" | "light" }) {
  return (
    <span className={`patch ${tone === "light" ? "patch-light" : ""}`} style={{ fontSize: size }}>
      {BRAND}
    </span>
  );
}
