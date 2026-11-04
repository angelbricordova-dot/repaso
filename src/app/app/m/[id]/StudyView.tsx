"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveProgress } from "@/app/app/actions";
import { Icon } from "@/components/app/Icon";
import { RichText } from "@/components/app/RichText";
import type { MaterialProgress, StudyKit } from "@/lib/types";

type Tab = "resumen" | "fichas" | "quiz" | "desarrollo" | "tutor";
type Msg = { id: string; role: "user" | "assistant"; content: string };

export function StudyView({
  materialId,
  kit,
  progress,
  initialMessages,
  tutorLimit,
  tutorUsed,
}: {
  materialId: string;
  kit: StudyKit;
  progress: MaterialProgress;
  initialMessages: Msg[];
  tutorLimit: number;
  tutorUsed: number;
}) {
  const [tab, setTab] = useState<Tab>("resumen");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const h = window.location.hash.replace("#", "") as Tab;
    if (!["resumen", "fichas", "quiz", "desarrollo", "tutor"].includes(h)) return;
    const id = requestAnimationFrame(() => setTab(h));
    return () => cancelAnimationFrame(id);
  }, []);
  const go = (t: Tab) => {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "resumen", label: "Resumen" },
    { id: "fichas", label: "Fichas", count: kit.flashcards.length },
    { id: "quiz", label: "Quiz", count: kit.quiz.length },
    { id: "desarrollo", label: "Desarrollo", count: kit.open_questions.length },
    { id: "tutor", label: "Tutor" },
  ];

  return (
    <div>
      <div role="tablist" aria-label="Formas de estudiar" className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => go(t.id)}
            className={`relative h-11 shrink-0 px-3 text-[14px] font-medium transition-colors ${tab === t.id ? "text-text" : "text-soft hover:text-text"}`}
          >
            {t.label}
            {t.count ? <span className="num ml-1.5 text-[12px] text-soft">{t.count}</span> : null}
            <span className={`absolute inset-x-2 -bottom-px h-[2px] rounded-full transition-colors ${tab === t.id ? "bg-text" : "bg-transparent"}`} />
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "resumen" && <Summary kit={kit} />}
        {tab === "fichas" && <Cards materialId={materialId} kit={kit} progress={progress} />}
        {tab === "quiz" && <Quiz materialId={materialId} kit={kit} best={progress.quiz_best} />}
        {tab === "desarrollo" && (
          <OpenQuestions
            kit={kit}
            onAskTutor={(text) => {
              setDraft(text);
              go("tutor");
            }}
          />
        )}
        {tab === "tutor" && <Tutor materialId={materialId} initial={initialMessages} limit={tutorLimit} used={tutorUsed} draft={draft} />}
      </div>
    </div>
  );
}

/* ─────────────────────────── Resumen ─────────────────────────── */

function Summary({ kit }: { kit: StudyKit }) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <article className="lg:col-span-8">
        {kit.summary.map((s, i) => (
          <section key={i} className={i > 0 ? "mt-8" : ""}>
            <h2 className="text-[18px] font-semibold tracking-[-0.01em]">{s.heading}</h2>
            <RichText text={s.body} className="prose-kit mt-2 max-w-[68ch] text-[16px] leading-[1.6]" />
          </section>
        ))}
      </article>
      <aside className="flex flex-col gap-4 lg:col-span-4">
        {kit.likely_exam_topics.length > 0 && (
          <section className="rounded-[16px] bg-[#f7fbd9] p-5">
            <h2 className="text-[14px] font-semibold">Lo que más pueden preguntar</h2>
            <ul className="mt-3 flex flex-col gap-2 text-[14px] leading-[1.45]">
              {kit.likely_exam_topics.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden="true">—</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="panel">
          <h2 className="text-[14px] font-semibold">
            Conceptos clave <span className="num ml-1 font-normal text-soft">{kit.key_concepts.length}</span>
          </h2>
          <dl className="mt-3 flex flex-col gap-3">
            {kit.key_concepts.map((c, i) => (
              <div key={i}>
                <dt className="text-[14px] font-medium">{c.term}</dt>
                <dd className="text-[14px] leading-[1.45] text-soft">{c.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      </aside>
    </div>
  );
}

/* ─────────────────────────── Fichas (cajas de Leitner) ─────────────────────────── */

function Cards({ materialId, kit, progress }: { materialId: string; kit: StudyKit; progress: MaterialProgress }) {
  const total = kit.flashcards.length;
  const [boxes, setBoxes] = useState<Record<string, number>>(progress.cards ?? {});
  const [flipped, setFlipped] = useState(false);
  const [onlyPending, setOnlyPending] = useState(true);
  const pendingSave = useRef<Record<string, number>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queue = useMemo(() => {
    const idx = kit.flashcards.map((_, i) => i);
    const list = onlyPending ? idx.filter((i) => (boxes[i] ?? 0) < 3) : idx;
    return list.sort((a, b) => (boxes[a] ?? 0) - (boxes[b] ?? 0) || a - b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyPending, kit.flashcards.length]);
  const [pos, setPos] = useState(0);
  const current = queue[pos];
  const known = Object.values(boxes).filter((b) => b >= 3).length;

  const flush = useCallback(() => {
    const patch = pendingSave.current;
    pendingSave.current = {};
    if (Object.keys(patch).length) saveProgress(materialId, { cards: patch });
  }, [materialId]);

  useEffect(() => () => flush(), [flush]);

  const grade = useCallback(
    (knew: boolean) => {
      if (current === undefined) return;
      const prev = boxes[current] ?? 0;
      const next = knew ? Math.min(prev + 1, 4) : Math.max(prev - 1, 0) || 0;
      setBoxes((b) => ({ ...b, [current]: next }));
      pendingSave.current[current] = next;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 1200);
      setFlipped(false);
      setPos((p) => p + 1);
    },
    [boxes, current, flush],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea,select")) return;
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && e.key === "1") grade(false);
      else if (flipped && e.key === "2") grade(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, grade]);

  return (
    <div className="mx-auto max-w-[680px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="num text-[14px] text-soft">
          {known} de {total} dominadas
        </p>
        <label className="flex items-center gap-2 text-[14px]">
          <input
            type="checkbox"
            checked={onlyPending}
            onChange={(e) => {
              setOnlyPending(e.target.checked);
              setPos(0);
              setFlipped(false);
            }}
            className="size-4 accent-[#0a0a0a]"
          />
          Solo las que me faltan
        </label>
      </div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-[#efe4e8]" aria-hidden="true">
        <div className="h-full rounded-full bg-data transition-[width] duration-500" style={{ width: `${total ? (known / total) * 100 : 0}%` }} />
      </div>

      {current === undefined ? (
        <div className="panel text-center">
          <p className="text-[18px] font-semibold">{queue.length === 0 ? "Ya dominas todas las fichas." : "Terminaste esta ronda."}</p>
          <p className="mt-1 text-[14px] text-soft">
            {queue.length === 0 ? "Pásate por el quiz para comprobarlo." : `Repasaste ${queue.length} fichas. Las que fallaste volverán primero.`}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              className="app-btn"
              onClick={() => {
                setOnlyPending(queue.length !== 0);
                setPos(0);
              }}
            >
              <Icon name="refresh" />
              Otra ronda
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="num mb-2 text-[13px] text-soft">
            Ficha {pos + 1} de {queue.length}
          </p>
          <button type="button" className="flip block w-full text-left" onClick={() => setFlipped((f) => !f)} aria-label={flipped ? "Ver la pregunta" : "Ver la respuesta"}>
            <div className={`flip-inner ${flipped ? "flipped" : ""}`}>
              <div className="flip-face flex min-h-[260px] flex-col justify-between rounded-[16px] border border-line bg-white p-6 md:min-h-[300px] md:p-8">
                <span className="text-[13px] text-soft">Pregunta</span>
                <p className="text-[22px] font-medium leading-[1.3] tracking-[-0.01em] md:text-[26px]">{kit.flashcards[current].front}</p>
                <span className="text-[13px] text-soft">Toca para voltear · barra espaciadora</span>
              </div>
              <div className="flip-face flip-back flex flex-col justify-between rounded-[16px] bg-ink p-6 text-white md:p-8">
                <span className="text-[13px] text-[#ffc2d4]">Respuesta</span>
                <p className="text-[18px] leading-[1.45] md:text-[20px]">{kit.flashcards[current].back}</p>
                <span className="text-[13px] text-[#ffc2d4]">¿La sabías?</span>
              </div>
            </div>
          </button>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" className="app-btn app-btn-secondary !h-12" onClick={() => (flipped ? grade(false) : setFlipped(true))}>
              {flipped ? "Repasar otra vez" : "Ver respuesta"}
            </button>
            <button type="button" className="app-btn !h-12" disabled={!flipped} onClick={() => grade(true)}>
              <Icon name="check" />
              La sabía
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────── Quiz ─────────────────────────── */

function Quiz({ materialId, kit, best }: { materialId: string; kit: StudyKit; best?: number }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const q = kit.quiz[i];
  const total = kit.quiz.length;

  function next() {
    if (i + 1 >= total) {
      const finalCorrect = correct;
      setDone(true);
      saveProgress(materialId, { quiz_last: Math.round((finalCorrect / total) * 100) });
      return;
    }
    setI(i + 1);
    setPicked(null);
  }

  if (!total) return <p className="text-[14px] text-soft">Este material no tiene preguntas de quiz.</p>;

  if (done) {
    const pct = Math.round((correct / total) * 100);
    return (
      <div className="panel mx-auto max-w-[680px] text-center">
        <p className="num text-[40px] font-normal leading-none tracking-[-0.02em]">{pct}%</p>
        <p className="num mt-2 text-[16px]">
          {correct} de {total} correctas
        </p>
        <p className="mt-1 text-[14px] text-soft">
          {pct >= 80 ? "Vas muy bien. Repasa las fichas que te falten y listo." : pct >= 50 ? "Vas por buen camino. Revisa el resumen de los temas que fallaste." : "Dale otra vuelta al resumen y vuelve a intentarlo."}
          {typeof best === "number" && best > pct ? ` Tu mejor intento fue ${best}%.` : ""}
        </p>
        <button
          type="button"
          className="app-btn mt-5"
          onClick={() => {
            setI(0);
            setPicked(null);
            setCorrect(0);
            setDone(false);
          }}
        >
          <Icon name="refresh" />
          Intentar de nuevo
        </button>
      </div>
    );
  }

  const answered = picked !== null;
  return (
    <div className="mx-auto max-w-[680px]">
      <div className="mb-4 flex items-center justify-between text-[14px] text-soft">
        <span className="num">
          Pregunta {i + 1} de {total}
        </span>
        <span className="num">{correct} correctas</span>
      </div>
      <h2 className="text-[20px] font-medium leading-[1.35] tracking-[-0.01em] md:text-[22px]">{q.question}</h2>
      <div className="mt-5 flex flex-col gap-2" role="group" aria-label="Opciones">
        {q.options.map((o, n) => {
          const isRight = n === q.correct;
          const state = !answered ? "idle" : isRight ? "right" : n === picked ? "wrong" : "dim";
          return (
            <button
              key={n}
              type="button"
              disabled={answered}
              onClick={() => {
                setPicked(n);
                if (n === q.correct) setCorrect((c) => c + 1);
              }}
              className={`flex min-h-[52px] items-center gap-3 rounded-[12px] border px-4 py-3 text-left text-[15px] transition-[background-color,border-color,transform] duration-150 active:scale-[0.99] ${
                state === "right"
                  ? "border-transparent bg-[#dcfae5] text-[#04250e]"
                  : state === "wrong"
                    ? "border-transparent bg-[#ffedea] text-[#831c1e]"
                    : state === "dim"
                      ? "border-line bg-white text-soft"
                      : "border-line bg-white hover:border-control"
              }`}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-panel text-[12px] font-semibold text-text">{"ABCD"[n]}</span>
              <span className="flex-1">{o}</span>
              {state === "right" && <Icon name="check" />}
              {state === "wrong" && <Icon name="x" />}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-5 rounded-[12px] bg-panel p-4" aria-live="polite">
          <p className="text-[14px] font-semibold">{picked === q.correct ? "Correcto" : `La respuesta era la ${"ABCD"[q.correct]}`}</p>
          <p className="mt-1 text-[14px] leading-[1.55]">{q.explanation}</p>
        </div>
      )}
      <div className="mt-5 flex justify-end">
        <button type="button" className="app-btn" disabled={!answered} onClick={next}>
          {i + 1 >= total ? "Ver resultado" : "Siguiente"}
          <Icon name="arrow-right" />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Preguntas de desarrollo ─────────────────────────── */

function OpenQuestions({ kit, onAskTutor }: { kit: StudyKit; onAskTutor: (text: string) => void }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  return (
    <ol className="mx-auto flex max-w-[760px] flex-col gap-6">
      {kit.open_questions.map((q, i) => (
        <li key={i} className="panel">
          <h2 className="text-[17px] font-medium leading-[1.35]">
            <span className="num mr-2 text-soft">{i + 1}.</span>
            {q.question}
          </h2>
          <label htmlFor={`a-${i}`} className="sr-only">
            Tu respuesta
          </label>
          <textarea
            id={`a-${i}`}
            className="field mt-4 !min-h-[96px]"
            placeholder="Escribe tu respuesta como si fuera el examen."
            value={answers[i] ?? ""}
            onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="app-btn app-btn-secondary"
              disabled={!answers[i]?.trim()}
              onClick={() => onAskTutor(`Corrige mi respuesta a esta pregunta de desarrollo y dime qué me faltó.\n\nPregunta: ${q.question}\n\nMi respuesta: ${answers[i]}`)}
            >
              Pedir corrección al tutor
            </button>
            <details className="group w-full">
              <summary className="cursor-pointer list-none py-2 text-[14px] font-medium underline underline-offset-4">Ver qué debe tener la respuesta</summary>
              <RichText text={q.answer_guide} className="prose-kit mt-2 text-[14px] leading-[1.55]" />
            </details>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ─────────────────────────── Tutor ─────────────────────────── */

function Tutor({ materialId, initial, limit, used, draft }: { materialId: string; initial: Msg[]; limit: number; used: number; draft: string }) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [input, setInput] = useState(draft);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(used);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  const left = Math.max(0, limit - count);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    setBusy(true);
    setInput("");
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    const botId = crypto.randomUUID();
    setMsgs((m) => [...m, userMsg, { id: botId, role: "assistant", content: "" }]);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ materialId, message: text }),
      });
      if (!res.ok || !res.body) {
        const msg = await res.text();
        setMsgs((m) => m.filter((x) => x.id !== botId));
        setError(msg || "El tutor no está disponible ahora.");
        if (res.status !== 402) setInput(text);
        return;
      }
      setCount((c) => c + 1);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        setMsgs((m) => m.map((x) => (x.id === botId ? { ...x, content: x.content + chunk } : x)));
      }
    } catch {
      setError("Se perdió la conexión. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[760px] flex-col">
      <div className="flex min-h-[320px] flex-col gap-4">
        {msgs.length === 0 && (
          <div className="panel">
            <p className="text-[15px] font-medium">Pregúntale a tu clase lo que no entendiste.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Explícame el tema como si tuviera 15 años", "¿Qué es lo más importante para el parcial?", "Dame un ejemplo de la vida real"].map((s) => (
                <button key={s} type="button" onClick={() => setInput(s)} className="rounded-full border border-line bg-white px-3 py-1.5 text-[13px] hover:border-control">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-[16px] rounded-br-[6px] bg-ink px-4 py-3 text-[15px] leading-[1.5] text-white">
              {m.content}
            </div>
          ) : (
            <div key={m.id} className="max-w-[92%] text-[15px] leading-[1.6]">
              {m.content ? <RichText text={m.content} className="prose-kit" /> : <span className="inline-block h-4 w-24 animate-pulse rounded bg-panel" aria-label="Escribiendo" />}
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="sticky bottom-0 mt-6 bg-ground pb-4 pt-2">
        {error && (
          <p className="mb-2 rounded-[10px] bg-[#ffedea] px-3 py-2 text-[13px] text-[#831c1e]" role="alert">
            {error}{" "}
            {error.includes("plan") && (
              <Link href="/app/plan" className="font-medium underline">
                Ver planes
              </Link>
            )}
          </p>
        )}
        <div className="flex items-end gap-2 rounded-[16px] border border-control bg-white p-2 focus-within:border-text">
          <label htmlFor="pregunta" className="sr-only">
            Tu pregunta
          </label>
          <textarea
            id="pregunta"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Escribe tu pregunta…"
            maxLength={2000}
            className="max-h-[200px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] outline-none"
            disabled={left === 0}
          />
          <button type="submit" className="app-btn !h-10 !px-3" disabled={busy || !input.trim() || left === 0} aria-label="Enviar pregunta">
            <Icon name="send" />
          </button>
        </div>
        <p className="num mt-2 px-1 text-[12px] text-soft">
          {left} de {limit} preguntas disponibles para este material · El tutor puede equivocarse.
        </p>
      </form>
    </div>
  );
}
