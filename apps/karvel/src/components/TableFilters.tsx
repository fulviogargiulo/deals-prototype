import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { useRef, useEffect } from "react";

export const thBase =
  "px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap";

export type SortDir = "asc" | "desc" | null;

export function SortIcon({ dir }: { dir: SortDir }) {
  if (!dir) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

export function FilterDropdown({
  options,
  selected,
  onChange,
  onClose,
  labels,
  className = "",
}: {
  options: string[];
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
  onClose: () => void;
  labels?: Record<string, string>;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const allSelected = selected.size === 0;

  return (
    <div
      ref={ref}
      className={`absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg p-2 min-w-[160px] max-h-[240px] overflow-auto ${className}`}
    >
      <label className="flex items-center gap-2 px-2 py-1.5 text-[12px] font-medium text-foreground hover:bg-muted rounded cursor-pointer">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={() => { if (allSelected) onChange(new Set(options)); else onChange(new Set()); }}
          className="rounded border-border"
        />
        All
      </label>
      <div className="border-t border-border my-1" />
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-foreground hover:bg-muted rounded cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected || selected.has(opt)}
            onChange={() => {
              if (allSelected) { onChange(new Set(options.filter((o) => o !== opt))); return; }
              const next = new Set(selected);
              if (next.has(opt)) next.delete(opt); else next.add(opt);
              onChange(next.size === options.length ? new Set() : next);
            }}
            className="rounded border-border"
          />
          {labels?.[opt] ?? opt}
        </label>
      ))}
    </div>
  );
}

export function SearchDropdown({
  value,
  onChange,
  onClose,
  placeholder = "Search...",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div
      ref={ref}
      className={`absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg p-2 min-w-[200px] ${className}`}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2 py-1.5 text-[12px] bg-background border border-border rounded outline-none focus:border-primary"
      />
      {value && (
        <button onClick={() => onChange("")} className="mt-1 text-[11px] text-muted-foreground hover:text-foreground">
          Clear
        </button>
      )}
    </div>
  );
}

export function DateRangeDropdown({
  value,
  onChange,
  onClose,
  className = "",
}: {
  value: { from: string; to: string };
  onChange: (v: { from: string; to: string }) => void;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[200px] space-y-2 ${className}`}
    >
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground">From</label>
        <input
          type="date"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="w-full px-2 py-1.5 text-[12px] bg-background border border-border rounded outline-none focus:border-primary"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground">To</label>
        <input
          type="date"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="w-full px-2 py-1.5 text-[12px] bg-background border border-border rounded outline-none focus:border-primary"
        />
      </div>
      {(value.from || value.to) && (
        <button onClick={() => onChange({ from: "", to: "" })} className="text-[11px] text-muted-foreground hover:text-foreground">
          Clear
        </button>
      )}
    </div>
  );
}
