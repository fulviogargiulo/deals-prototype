import { Plus } from "lucide-react";

interface EmptyScheduleStateProps {
  showFullScheduleLink?: boolean;
  onClick?: () => void;
}

export function EmptyScheduleState({ showFullScheduleLink = true, onClick }: EmptyScheduleStateProps) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex flex-col items-center justify-center py-6 px-5 text-center rounded-lg border border-dashed border-border bg-[#00000005] gap-2 cursor-pointer hover:bg-muted/30 transition-colors"
      style={{ borderStyle: 'dashed', borderWidth: '1px' }}
    >
      <Plus className="w-6 h-6 text-muted-foreground" />
      <h3 className="text-lg font-semibold leading-heading text-foreground">Create a new item</h3>
      <p className="text-sm text-muted-foreground leading-body">Your schedule is currently free for today</p>
    </button>
  );
}
