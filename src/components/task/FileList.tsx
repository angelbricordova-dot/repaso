import { Icon } from "@/components/app/Icon";
import { formatBytes } from "@/lib/format";
import type { StoredFile } from "@/lib/types";

export function FileList({ files, urls }: { files: StoredFile[]; urls: Map<string, string> }) {
  if (!files.length) return null;
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {files.map((f) => {
        const url = urls.get(f.path);
        const isImg = f.type.startsWith("image/");
        return (
          <li key={f.path}>
            <a href={url} target="_blank" rel="noopener" className="card flex min-h-[60px] items-center gap-3 px-3 py-2 transition-colors hover:border-line-strong">
              {isImg && url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="size-11 shrink-0 rounded-[8px] object-cover" loading="lazy" />
              ) : (
                <span className="grid size-11 shrink-0 place-items-center rounded-[8px] bg-surface text-[11px] font-bold text-ink-soft">
                  {f.name.split(".").pop()?.toUpperCase().slice(0, 4)}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium">{f.name}</span>
                <span className="num text-[12.5px] text-ink-soft">{formatBytes(f.size)}</span>
              </span>
              <Icon name="download" className="size-4 text-ink-soft" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
