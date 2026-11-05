"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LevelSelect } from "@/components/landing/LevelSelect";
import { TERMS_VERSION } from "@/lib/legal";
import { createClient } from "@/lib/supabase/client";
import type { Level } from "@/lib/types";

const site = () => process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

function translate(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Confirma tu correo: te enviamos un enlace al registrarte.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Ese correo ya tiene cuenta. Inicia sesión.";
  if (m.includes("password")) return "La contraseña debe tener al menos 8 caracteres.";
  if (m.includes("rate limit")) return "Demasiados intentos. Espera unos minutos.";
  return "Algo salió mal. Intenta de nuevo.";
}

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error") === "enlace" ? "El enlace venció o ya se usó. Inicia sesión o pide uno nuevo." : null);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          setError(translate(error.message));
          setBusy(false);
          return;
        }
        const next = params.get("siguiente");
        router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/app");
        router.refresh();
      }}
    >
      <div>
        <label htmlFor="email" className="field-label">
          Correo
        </label>
        <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="field-label">
            Contraseña
          </label>
          <Link href="/recuperar" className="text-[13px] text-ink-soft underline underline-offset-4">
            ¿La olvidaste?
          </Link>
        </div>
        <input id="password" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      </div>
      {error && (
        <p className="rounded-[10px] bg-[#fbe5e3] px-3 py-2 text-[14px] text-[#8e2019]" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn w-full" disabled={busy}>
        {busy ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

export function SignUpForm() {
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const initialLevel = (["bachillerato", "diversificado", "universidad"].includes(params.get("nivel") ?? "") ? params.get("nivel") : "bachillerato") as Level;
  const [level, setLevel] = useState<Level>(initialLevel);
  const [institution, setInstitution] = useState("");
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const ref = (params.get("ref") ?? "").slice(0, 12);

  // Lo que eligió en la portada viaja a «Nueva tarea»
  const next = (() => {
    const plan = params.get("plan");
    if (plan) return `/app/plan?plan=${encodeURIComponent(plan)}`;
    const q = new URLSearchParams();
    for (const k of ["nivel", "materia", "entrega"]) {
      const v = params.get(k);
      if (v) q.set(k, v);
    }
    return q.toString() ? `/app/nueva?${q}` : "/app/nueva";
  })();

  if (sent)
    return (
      <div role="status">
        <h2 className="font-[family-name:var(--font-display)] text-[24px] font-bold">Revisa tu correo</h2>
        <p className="mt-2 text-[16px] leading-[1.5] text-ink-soft">
          Te enviamos un enlace a <strong className="text-marino">{email}</strong> para confirmar tu cuenta. Si no lo ves, revisa spam o promociones.
        </p>
      </div>
    );

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!accept) return setError("Debes aceptar los términos y la política de privacidad.");
        if (whatsapp.replace(/\D/g, "").length < 10) return setError("Escribe tu número de WhatsApp: por ahí te avisamos cuando tu tarea esté lista.");
        setBusy(true);
        setError(null);
        const { data, error } = await createClient().auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${site()}/auth/callback?next=${encodeURIComponent(next)}`,
            data: { full_name: name.trim(), whatsapp: whatsapp.trim(), level, institution: institution.trim(), ref, terms_version: TERMS_VERSION },
          },
        });
        setBusy(false);
        if (error) return setError(translate(error.message));
        if (data.session) {
          window.location.assign(next);
          return;
        }
        setSent(true);
      }}
    >
      {ref && (
        <p className="rounded-[12px] bg-beige px-4 py-3 text-[14.5px] font-medium">Te invitaron con el código {ref.toUpperCase()}. Al pagar tu primer plan te regalamos una tarea extra.</p>
      )}
      <div>
        <label htmlFor="name" className="field-label">
          Nombre y apellido
        </label>
        <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoComplete="name" />
      </div>
      <div>
        <label htmlFor="wa" className="field-label">
          WhatsApp
        </label>
        <input id="wa" className="field num" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required maxLength={30} inputMode="tel" autoComplete="tel" placeholder="0412-1234567" aria-describedby="wa-hint" />
        <p id="wa-hint" className="hint">
          Te avisamos por aquí cuando tu tarea esté lista.
        </p>
      </div>
      <div>
        <span className="field-label">Nivel</span>
        <LevelSelect value={level} onChange={setLevel} label="Nivel" />
      </div>
      <div>
        <label htmlFor="inst" className="field-label">
          Liceo o universidad <span className="font-normal text-ink-soft">(opcional)</span>
        </label>
        <input id="inst" className="field" value={institution} onChange={(e) => setInstitution(e.target.value)} maxLength={120} />
      </div>
      <div>
        <label htmlFor="email" className="field-label">
          Correo
        </label>
        <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Contraseña
        </label>
        <input id="password" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" aria-describedby="pw-hint" />
        <p id="pw-hint" className="hint">
          Mínimo 8 caracteres.
        </p>
      </div>
      <label className="flex items-start gap-3 text-[14.5px] leading-[1.45]">
        <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[#14234a]" required />
        <span>
          Tengo 18 años o más, o permiso de mi representante, y acepto los{" "}
          <Link href="/terminos" target="_blank" className="underline">
            términos
          </Link>{" "}
          y la{" "}
          <Link href="/privacidad" target="_blank" className="underline">
            política de privacidad
          </Link>
          .
        </span>
      </label>
      {error && (
        <p className="rounded-[10px] bg-[#fbe5e3] px-3 py-2 text-[14px] text-[#8e2019]" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn w-full" disabled={busy}>
        {busy ? "Creando tu cuenta…" : "Crear cuenta y mandar mi tarea"}
      </button>
    </form>
  );
}

export function ResetRequestForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (sent)
    return (
      <p className="text-[15px] leading-[1.5]" role="status">
        Si existe una cuenta con <strong>{email}</strong>, te llegará un enlace para crear una contraseña nueva.
      </p>
    );
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${site()}/auth/callback?next=/nueva-clave` });
        setBusy(false);
        if (error) return setError(translate(error.message));
        setSent(true);
      }}
    >
      <div>
        <label htmlFor="email" className="field-label">
          Correo
        </label>
        <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </div>
      {error && <p className="text-[13px] text-rojo">{error}</p>}
      <button type="submit" className="app-btn !h-11" disabled={busy}>
        Enviar enlace
      </button>
    </form>
  );
}

export function NewPasswordForm() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const { error } = await createClient().auth.updateUser({ password: pw });
        setBusy(false);
        if (error) return setError("El enlace venció. Pide uno nuevo desde «¿La olvidaste?».");
        router.replace("/app");
      }}
    >
      <div>
        <label htmlFor="pw" className="field-label">
          Contraseña nueva
        </label>
        <input id="pw" type="password" className="field" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={8} autoComplete="new-password" />
      </div>
      {error && <p className="text-[13px] text-rojo">{error}</p>}
      <button type="submit" className="app-btn !h-11" disabled={busy}>
        Guardar y entrar
      </button>
    </form>
  );
}
