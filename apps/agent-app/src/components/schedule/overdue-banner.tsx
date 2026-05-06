import { CalendarClock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverdueBannerProps {
  count: number;
  onClick?: () => void;
}

export function OverdueBanner({ count, onClick }: OverdueBannerProps) {
  if (count === 0) return null;

  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between gap-2 px-3 py-3 rounded-2xl",
        "bg-card",
        "hover:bg-muted/50 transition-colors"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <CalendarClock className="w-5 h-5 text-destructive shrink-0" />
        <span className="font-semibold text-sm text-foreground truncate">
          {count} {count === 1 ? 'item' : 'items'} overdue
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}
