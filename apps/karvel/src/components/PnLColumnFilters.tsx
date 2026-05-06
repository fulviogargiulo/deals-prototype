import { useState, useRef, useEffect } from "react";
import { Filter, X } from "lucide-react";

export type FilterType = "text" | "multiselect" | "number";

export interface ColumnFilterConfig {
  key: string;
  label: string;
  type: FilterType;
  options?: string[]; // for multiselect
}

export interface ActiveFilter {
  key: string;
  label: string;
  type: FilterType;
  textValue?: string;
  selectedValues?: Set<string>;
  min?: number;
  max?: number;
}

interface FilterDropdownProps {
  config: ColumnFilterConfig;
  current?: ActiveFilter;
  onApply: (filter: ActiveFilter | null) => void;
  onClose: () => void;
}

function FilterDropdown({ config, current, onApply, onClose }: FilterDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [textValue, setTextValue] = useState(current?.textValue || "");
  const [selected, setSelected] = useState<Set<string>>(current?.selectedValues || new Set());
  const [min, setMin] = useState<string>(current?.min != null ? String(current.min) : "");
  const [max, setMax] = useState<string>(current?.max != null ? String(current.max) : "");

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const apply = () => {
    if (config.type === "text") {
      if (!textValue.trim()) { onApply(null); return; }
      onApply({ key: config.key, label: config.label, type: "text", textValue: textValue.trim() });
    } else if (config.type === "multiselect") {
      if (selected.size === 0) { onApply(null); return; }
      onApply({ key: config.key, label: config.label, type: "multiselect", selectedValues: selected });
    } else if (config.type === "number") {
      const minVal = min ? parseFloat(min) : undefined;
      const maxVal = max ? parseFloat(max) : undefined;
      if (minVal == null && maxVal == null) { onApply(null); return; }
      onApply({ key: config.key, label: config.label, type: "number", min: minVal, max: maxVal });
    }
    onClose();
  };

  const clear = () => { onApply(null); onClose(); };

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg p-2.5 min-w-[180px]">
      {config.type === "text" && (
        <div className="space-y-2">
          <input
            autoFocus
            type="text"
            placeholder={`Filter ${config.label}...`}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            className="w-full px-2 py-1.5 text-[12px] border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      )}

      {config.type === "multiselect" && config.options && (
        <div className="space-y-1 max-h-[200px] overflow-auto">
          <label className="flex items-center gap-2 px-1 py-1 text-[11px] font-medium text-foreground hover:bg-muted rounded cursor-pointer">
            <input
              type="checkbox"
              checked={selected.size === config.options.length}
              onChange={() => {
                if (selected.size === config.options!.length) setSelected(new Set());
                else setSelected(new Set(config.options));
              }}
              className="rounded border-border h-3 w-3"
            />
            Select All
          </label>
          <div className="border-t border-border my-1" />
          {config.options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 px-1 py-1 text-[11px] text-foreground hover:bg-muted rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(opt)}
                onChange={() => {
                  const next = new Set(selected);
                  if (next.has(opt)) next.delete(opt);
                  else next.add(opt);
                  setSelected(next);
                }}
                className="rounded border-border h-3 w-3"
              />
              {opt}
            </label>
          ))}
        </div>
      )}

      {config.type === "number" && (
        <div className="space-y-2">
          <input
            type="number"
            placeholder="Min"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="w-full px-2 py-1.5 text-[12px] border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="number"
            placeholder="Max"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="w-full px-2 py-1.5 text-[12px] border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      )}

      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
        <button onClick={clear} className="text-[11px] text-muted-foreground hover:text-foreground">Clear</button>
        <button onClick={apply} className="ml-auto px-2.5 py-1 text-[11px] font-medium bg-primary text-primary-foreground rounded hover:opacity-90">Apply</button>
      </div>
    </div>
  );
}

/* ---- Filter icon in column header ---- */
export function ColumnFilterIcon({
  config,
  activeFilter,
  onApply,
}: {
  config: ColumnFilterConfig;
  activeFilter?: ActiveFilter;
  onApply: (filter: ActiveFilter | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = !!activeFilter;

  return (
    <div className="relative inline-flex">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`p-0.5 rounded transition-colors ${isActive ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
      >
        {isActive ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
      </button>
      {open && (
        <FilterDropdown
          config={config}
          current={activeFilter}
          onApply={onApply}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

/* ---- Active filter chips bar ---- */
export function ActiveFilterChips({
  filters,
  onRemove,
  onClearAll,
}: {
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}) {
  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap mb-3">
      <span className="text-[11px] text-muted-foreground font-medium">{filters.length} filter{filters.length > 1 ? "s" : ""} active:</span>
      {filters.map((f) => {
        let display = f.label + ": ";
        if (f.type === "text") display += `"${f.textValue}"`;
        else if (f.type === "multiselect") display += `${f.selectedValues?.size} selected`;
        else if (f.type === "number") {
          if (f.min != null && f.max != null) display += `${f.min}–${f.max}`;
          else if (f.min != null) display += `≥ ${f.min}`;
          else display += `≤ ${f.max}`;
        }
        return (
          <span key={f.key} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-[11px] font-medium">
            {display}
            <button onClick={() => onRemove(f.key)} className="hover:text-primary/70">
              <X className="h-3 w-3" />
            </button>
          </span>
        );
      })}
      <button onClick={onClearAll} className="text-[11px] text-primary hover:underline">Clear all</button>
    </div>
  );
}
