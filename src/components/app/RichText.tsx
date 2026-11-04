import { Fragment } from "react";

/**
 * Muestra el texto de la IA con párrafos, listas (- o 1.) y **negritas**,
 * sin usar HTML crudo (nada de dangerouslySetInnerHTML).
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks: { type: "p" | "ul" | "ol"; lines: string[] }[] = [];
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (!line) {
      blocks.push({ type: "p", lines: [] });
      continue;
    }
    const ul = line.match(/^[-•*]\s+(.*)$/);
    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    const type = ul ? "ul" : ol ? "ol" : "p";
    const content = ul ? ul[1] : ol ? ol[1] : line.replace(/^#{1,6}\s+/, "");
    const last = blocks[blocks.length - 1];
    if (last && last.type === type && (type !== "p" || last.lines.length)) last.lines.push(content);
    else blocks.push({ type, lines: [content] });
  }

  return (
    <div className={className}>
      {blocks
        .filter((b) => b.lines.length)
        .map((b, i) =>
          b.type === "p" ? (
            <p key={i}>
              {b.lines.map((l, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  <Inline text={l} />
                </Fragment>
              ))}
            </p>
          ) : b.type === "ul" ? (
            <ul key={i}>
              {b.lines.map((l, j) => (
                <li key={j}>
                  <Inline text={l} />
                </li>
              ))}
            </ul>
          ) : (
            <ol key={i}>
              {b.lines.map((l, j) => (
                <li key={j}>
                  <Inline text={l} />
                </li>
              ))}
            </ol>
          ),
        )}
    </div>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") && p.length > 4 ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  );
}
