import { Icon } from "./Icon";

export function KindIcon({ kind }: { kind: string }) {
  const name = kind === "audio" ? "mic" : kind === "video" ? "video" : kind === "image" ? "image" : kind === "text" ? "text" : kind === "slides" ? "slides" : "file";
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-panel text-[#5d5559]">
      <Icon name={name} />
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  if (status === "ready") return <span className="pill pill-positive">Lista</span>;
  if (status === "processing") return <span className="pill pill-warning">Preparando</span>;
  if (status === "error") return <span className="pill pill-negative">Falló</span>;
  return <span className="pill">Pendiente</span>;
}

export function RequestPill({ status }: { status: string }) {
  if (status === "respondido") return <span className="pill pill-positive">Respondido</span>;
  if (status === "en_revision") return <span className="pill pill-warning">En revisión</span>;
  if (status === "cerrado") return <span className="pill">Cerrado</span>;
  return <span className="pill">Recibido</span>;
}
