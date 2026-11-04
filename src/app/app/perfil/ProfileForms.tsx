"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAccount, updateProfile } from "@/app/app/actions";
import { createClient } from "@/lib/supabase/client";

type P = { full_name: string; university: string; career: string; semester: string; phone: string };

const UNIVERSITIES = ["UCV", "UCAB", "USB", "ULA", "LUZ", "UC", "UNIMET", "UCLA", "UDO", "UNEFA", "UPEL", "URU", "UNET", "USM", "UJMV", "UNEXPO"];

export function ProfileForm({ initial }: { initial: P }) {
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof P) => (e: React.ChangeEvent<HTMLInputElement>) => setP({ ...p, [k]: e.target.value });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await updateProfile(p);
          setMsg(r.ok ? "Guardado" : r.error);
          router.refresh();
        });
      }}
    >
      <div>
        <label htmlFor="f-name" className="field-label">
          Nombre y apellido
        </label>
        <input id="f-name" className="field" value={p.full_name} onChange={set("full_name")} maxLength={120} autoComplete="name" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="f-uni" className="field-label">
            Universidad
          </label>
          <input id="f-uni" className="field" list="unis" value={p.university} onChange={set("university")} maxLength={120} placeholder="UCV" />
          <datalist id="unis">
            {UNIVERSITIES.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="f-career" className="field-label">
            Carrera
          </label>
          <input id="f-career" className="field" value={p.career} onChange={set("career")} maxLength={120} placeholder="Economía" />
        </div>
        <div>
          <label htmlFor="f-sem" className="field-label">
            Semestre o año
          </label>
          <input id="f-sem" className="field" value={p.semester} onChange={set("semester")} maxLength={40} placeholder="4to semestre" />
        </div>
        <div>
          <label htmlFor="f-phone" className="field-label">
            WhatsApp <span className="font-normal text-soft">(opcional)</span>
          </label>
          <input id="f-phone" className="field" value={p.phone} onChange={set("phone")} maxLength={30} inputMode="tel" placeholder="0412-0000000" autoComplete="tel" />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        {msg && (
          <span className="text-[13px] text-soft" role="status">
            {msg}
          </span>
        )}
        <button type="submit" className="app-btn" disabled={pending}>
          Guardar
        </button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (pw.length < 8) return setMsg("Usa al menos 8 caracteres.");
        setBusy(true);
        const { error } = await createClient().auth.updateUser({ password: pw });
        setBusy(false);
        setMsg(error ? "No pudimos cambiar la contraseña. Inicia sesión de nuevo e intenta otra vez." : "Contraseña actualizada");
        if (!error) setPw("");
      }}
    >
      <div>
        <label htmlFor="f-pw" className="field-label">
          Nueva contraseña
        </label>
        <input id="f-pw" type="password" className="field" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} autoComplete="new-password" />
      </div>
      <div className="flex items-center justify-end gap-3">
        {msg && (
          <span className="text-[13px] text-soft" role="status">
            {msg}
          </span>
        )}
        <button type="submit" className="app-btn" disabled={busy}>
          Cambiar contraseña
        </button>
      </div>
    </form>
  );
}

export function DangerZone({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!open)
    return (
      <div>
        <button type="button" className="app-btn app-btn-danger" onClick={() => setOpen(true)}>
          Borrar mi cuenta
        </button>
      </div>
    );
  return (
    <div className="flex flex-col gap-3 rounded-[12px] bg-white p-4 ring-1 ring-[#f1c4c6]">
      <p className="text-[14px]">
        Se borrarán tu cuenta, tus materias, todos tus materiales y archivos, y tus envíos. Los registros de pago se conservan por obligación contable, sin tus archivos. Esto no se puede deshacer.
      </p>
      <div>
        <label htmlFor="f-confirm" className="field-label">
          Escribe tu correo para confirmar
        </label>
        <input id="f-confirm" className="field" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={email} autoComplete="off" />
      </div>
      {error && <p className="text-[13px] text-negative">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          className="app-btn app-btn-danger"
          disabled={pending || confirm.trim().toLowerCase() !== email.toLowerCase()}
          onClick={() =>
            start(async () => {
              const r = await deleteAccount(confirm);
              if (!r.ok) return setError(r.error);
              await createClient().auth.signOut();
              router.replace("/");
              router.refresh();
            })
          }
        >
          Borrar cuenta para siempre
        </button>
        <button type="button" className="app-btn app-btn-ghost" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
