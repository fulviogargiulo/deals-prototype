import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScheduleDisplayMode, OverdueDisplayMode } from "@/components/schedule/activity-widget";

interface ScheduleDevToolProps {
  displayMode: ScheduleDisplayMode;
  setDisplayMode: (mode: ScheduleDisplayMode) => void;
  overdueDisplayMode: OverdueDisplayMode;
  setOverdueDisplayMode: (mode: OverdueDisplayMode) => void;
}

export function ScheduleDevTool({
  displayMode,
  setDisplayMode,
  overdueDisplayMode,
  setOverdueDisplayMode,
}: ScheduleDevToolProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Schedule Dev Tools</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Activities Display
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={displayMode}
          onValueChange={(v) => setDisplayMode(v as ScheduleDisplayMode)}
        >
          <DropdownMenuRadioItem value="empty">Empty</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="few">Few activities</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="many">Many activities</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Overdue Tasks
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={overdueDisplayMode}
          onValueChange={(v) => setOverdueDisplayMode(v as OverdueDisplayMode)}
        >
          <DropdownMenuRadioItem value="none">No overdue</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="some">Show overdue</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
