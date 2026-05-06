import { cn } from "@/lib/utils";

export type ScheduleFilter = "all" | "overdue" | "completed";

interface ScheduleFiltersProps {
  activeFilter: ScheduleFilter;
  onFilterChange: (filter: ScheduleFilter) => void;
}

const filters: { value: ScheduleFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "overdue", label: "Overdue tasks" },
  { value: "completed", label: "Completed tasks" },
];

export function ScheduleFilters({ activeFilter, onFilterChange }: ScheduleFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-auto-hide">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-smooth",
            activeFilter === filter.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
