import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Props {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function MultiSelectFilter({ label, options, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allSelected = selected.length === options.length;

  const toggleAll = () => {
    onChange(allSelected ? [] : [...options]);
  };

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const plural = label.endsWith("y") ? label.slice(0, -1) + "ies" : label + "s";
  const displayText = allSelected
    ? `All ${plural}`
    : selected.length === 0
      ? `No ${label}`
      : selected.length === 1
        ? selected[0]
        : `${selected.length} ${plural}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 appearance-none pl-4 pr-9 py-2.5 border border-border bg-card rounded-md text-[13px] font-medium text-foreground hover:bg-muted transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {displayText}
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] bg-popover border border-border rounded-md shadow-md py-1">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-foreground hover:bg-accent transition-colors"
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center ${allSelected ? "bg-primary border-primary" : "border-border"}`}>
              {allSelected && <Check className="h-3 w-3 text-primary-foreground" />}
            </div>
            Select All
          </button>
          <div className="h-px bg-border mx-1 my-1" />
          {options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggleOption(opt)}
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-foreground hover:bg-accent transition-colors"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? "bg-primary border-primary" : "border-border"}`}>
                  {checked && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
