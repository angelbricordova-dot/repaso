"use client";
import { useState } from "react";

export function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-stretch overflow-hidden rounded-[12px] bg-papel shadow-[inset_0_0_0_1px_rgba(20,35,74,0.15)]">
      <label htmlFor="enlace" className="sr-only">
        Tu enlace de invitación
      </label>
      <input id="enlace" readOnly value={link} className="min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none" onFocus={(e) => e.target.select()} />
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            setCopied(false);
          }
        }}
        className="min-h-[48px] min-w-[96px] bg-marino px-4 text-[14px] font-semibold text-papel transition-transform duration-150 active:scale-[0.97]"
        aria-live="polite"
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
