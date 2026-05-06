import { useState, useRef, useEffect } from "react";
import { Columns3, Search, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";

export interface ColumnGroup {
  key: string;
  label: string;
  columns: string[]; // column keys
}

interface Props {
  groups: ColumnGroup[];
  columnLabels: Record<string, string>;
  visibleColumns: Set<string>;
  onChange: (visible: Set<string>) => void;
}

const STORAGE_KEY = "pnl-visible-columns-v6";

export function loadSavedVisibility(allKeys: string[], defaultKeys: string[]): Set<string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      // Only include keys that still exist
      const valid = parsed.filter((k) => allKeys.includes(k));
      if (valid.length > 0) return new Set(valid);
    }
  } catch {}
  return new Set(defaultKeys);
}

export function saveVisibility(visible: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...visible]));
  } catch {}
}

export function ColumnVisibilityManager({ groups, columnLabels, visibleColumns, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(groups.map((g) => g.key)));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  const toggleGroupVisibility = (group: ColumnGroup) => {
    const allVisible = group.columns.every((c) => visibleColumns.has(c));
    const next = new Set(visibleColumns);
    group.columns.forEach((c) => {
      if (allVisible) next.delete(c);
      else next.add(c);
    });
    onChange(next);
    saveVisibility(next);
  };

  const toggleColumn = (colKey: string) => {
    const next = new Set(visibleColumns);
    if (next.has(colKey)) next.delete(colKey);
    else next.add(colKey);
    onChange(next);
    saveVisibility(next);
  };

  const showAll = () => {
    const all = new Set(groups.flatMap((g) => g.columns));
    onChange(all);
    saveVisibility(all);
  };

  const q = search.toLowerCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border border-border rounded-md bg-card hover:bg-muted transition-colors text-foreground"
      >
        <Columns3 className="h-3.5 w-3.5" />
        Columns
        <span className="text-muted-foreground ml-0.5">({visibleColumns.size})</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl w-[300px] max-h-[460px] flex flex-col">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search columns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-border rounded bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Show All button */}
          <div className="px-2 py-1.5 border-b border-border">
            <button
              onClick={showAll}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Show All Columns
            </button>
          </div>

          {/* Groups */}
          <div className="overflow-y-auto flex-1 p-1">
            {groups.map((group) => {
              const filteredCols = group.columns.filter((c) =>
                q ? (columnLabels[c] || c).toLowerCase().includes(q) : true
              );
              if (filteredCols.length === 0) return null;
              const allVisible = group.columns.every((c) => visibleColumns.has(c));
              const someVisible = group.columns.some((c) => visibleColumns.has(c));
              const isExpanded = expandedGroups.has(group.key);

              return (
                <div key={group.key} className="mb-0.5">
                  <div className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-muted/50">
                    <button onClick={() => toggleGroup(group.key)} className="p-0.5">
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleGroupVisibility(group)}
                      className="p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      {allVisible ? <Eye className="h-3.5 w-3.5" /> : someVisible ? <Eye className="h-3.5 w-3.5 opacity-50" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <span className="text-[12px] font-semibold text-foreground flex-1">{group.label}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {group.columns.filter((c) => visibleColumns.has(c)).length}/{group.columns.length}
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="ml-5">
                      {filteredCols.map((colKey) => (
                        <label
                          key={colKey}
                          className="flex items-center gap-2 px-2 py-1 text-[11px] text-foreground hover:bg-muted/50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={visibleColumns.has(colKey)}
                            onChange={() => toggleColumn(colKey)}
                            className="rounded border-border h-3 w-3"
                          />
                          {columnLabels[colKey] || colKey}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
