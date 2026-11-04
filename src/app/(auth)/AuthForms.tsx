"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { TERMS_VERSION } from "@/lib/legal";
import { createClient } from "@/lib/supabase/client";

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
          <Link href="/recuperar" className="text-[13px] text-soft underline underline-offset-4">
            ¿La olvidaste?
          </Link>
        </div>
        <input id="password" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      </div>
      {error && (
        <p className="rounded-[10px] bg-[#ffedea] px-3 py-2 text-[13px] text-[#831c1e]" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="app-btn !h-11" disabled={busy}>
        {busy ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

export function SignUpForm() {
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [career, setCareer] = useState("");
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const materia = params.get("materia");

  if (sent)
    return (
      <div role="status">
        <h2 className="text-[20px] font-semibold">Revisa tu correo</h2>
        <p className="mt-2 text-[15px] leading-[1.5] text-soft">
          Te enviamos un enlace a <strong className="text-text">{email}</strong> para confirmar tu cuenta. Si no lo ves, revisa la carpeta de spam o promociones.
        </p>
      </div>
    );

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!accept) return setError("Debes aceptar los términos y la política de privacidad.");
        setBusy(true);
        setError(null);
        const next = materia ? `/app/subir?materia=${encodeURIComponent(materia)}` : "/app";
        const { data, error } = await createClient().auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${site()}/auth/callback?next=${encodeURIComponent(next)}`,
            data: { full_name: name.trim(), university: university.trim(), career: career.trim(), terms_version: TERMS_VERSION },
          },
        });
        setBusy(false);
        if (error) return setError(translate(error.message));
        if (data.session) {
          window.location.href = next;
          return;
        }
        setSent(true);
      }}
    >
      <div>
        <label htmlFor="name" className="field-label">
          Nombre y apellido
        </label>
        <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoComplete="name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="uni" className="field-label">
            Universidad
          </label>
          <input id="uni" className="field" value={university} onChange={(e) => setUniversity(e.target.value)} maxLength={120} placeholder="UCAB" />
        </div>
        <div>
          <label htmlFor="career" className="field-label">
            Carrera
          </label>
          <input id="career" className="field" value={career} onChange={(e) => setCareer(e.target.value)} maxLength={120} placeholder="Derecho" />
        </div>
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
        <input
          id="password"
          type="password"
          className="field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          aria-describedby="pw-hint"
        />
        <p id="pw-hint" className="hint">
          Mínimo 8 caracteres.
        </p>
      </div>
      <label className="flex items-start gap-3 text-[14px] leading-[1.45]">
        <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[#0a0a0a]" required />
        <span>
          Tengo 18 años o más (o permiso de mi representante) y acepto los{" "}
          <Link href="/terminos" target="_blank" className="underline underline-offset-4">
            términos y condiciones
          </Link>{" "}
          y la{" "}
          <Link href="/privacidad" target="_blank" className="underline underline-offset-4">
            política de privacidad
          </Link>
          .
        </span>
      </label>
      {error && (
        <p className="rounded-[10px] bg-[#ffedea] px-3 py-2 text-[13px] text-[#831c1e]" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="app-btn !h-11" disabled={busy}>
        {busy ? "Creando tu cuenta…" : "Crear cuenta gratis"}
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
      {error && <p className="text-[13px] text-negative">{error}</p>}
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
      {error && <p className="text-[13px] text-negative">{error}</p>}
      <button type="submit" className="app-btn !h-11" disabled={busy}>
        Guardar y entrar
      </button>
    </form>
  );
}
