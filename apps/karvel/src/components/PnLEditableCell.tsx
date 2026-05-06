import { useState, useRef, useEffect } from "react";

interface EditableCellProps {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: "text" | "number" | "date" | "select";
  options?: string[];
  align?: "left" | "right";
  computed?: boolean;
  missing?: boolean;
  critical?: boolean;
  formatter?: (v: number) => string;
  className?: string;
}

export function EditableCell({
  value,
  onChange,
  type = "text",
  options,
  align = "left",
  computed,
  missing,
  critical,
  formatter,
  className = "",
}: EditableCellProps) {
  const tdClass = "px-2 py-1.5 text-[12px] whitespace-nowrap";

  if (computed) {
    const display = typeof value === "number" && formatter ? formatter(value) : String(value);
    return (
      <td className={`${tdClass} ${align === "right" ? "text-right" : "text-left"} tabular-nums text-muted-foreground italic font-medium ${className}`}>
        {display}
      </td>
    );
  }

  if (type === "select" && options) {
    return (
      <td className={`${tdClass} ${className}`}>
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-1.5 py-1 border rounded text-[12px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring ${critical ? "border-destructive ring-1 ring-destructive/50" : missing ? "border-amber-500 ring-1 ring-amber-500/50" : "border-border"}`}
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </td>
    );
  }

  const display = type === "number" && typeof value === "number" && formatter
    ? formatter(value)
    : String(value ?? "");

  return (
    <td className={`${tdClass} ${className}`}>
      <input
        type={type}
        value={type === "number" ? (value as number) : String(value ?? "")}
        onChange={(e) => {
          if (type === "number") {
            onChange(parseFloat(e.target.value) || 0);
          } else {
            onChange(e.target.value);
          }
        }}
        className={`w-full px-1.5 py-1 border rounded text-[12px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring tabular-nums ${
          align === "right" ? "text-right" : "text-left"
        } ${critical ? "border-destructive ring-1 ring-destructive/50" : missing ? "border-amber-500 ring-1 ring-amber-500/50" : "border-border"}`}
      />
    </td>
  );
}

export function ReadOnlyCell({
  value,
  align = "left",
  className = "",
}: {
  value: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td className={`px-2 py-1.5 text-[12px] font-medium whitespace-nowrap ${align === "right" ? "text-right tabular-nums" : "text-left"} text-foreground ${className}`}>
      {value}
    </td>
  );
}
