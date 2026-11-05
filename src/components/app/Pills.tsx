import { STATUS } from "@/lib/tasks";
import type { TaskStatus } from "@/lib/types";

const TONE: Record<string, string> = {
  neutral: "",
  progress: "pill-progress",
  attention: "pill-attention",
  done: "pill-done",
  muted: "pill-muted",
};

export function StatusPill({ status }: { status: TaskStatus }) {
  const s = STATUS[status];
  return <span className={`pill ${TONE[s.tone]}`}>{s.label}</span>;
}
