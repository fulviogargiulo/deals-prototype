import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";

interface VisitDateTimePillsProps {
  date: string;
  time: string;
  duration?: string;
}

export function VisitDateTimePills({ date, time, duration }: VisitDateTimePillsProps) {
  const visitDate = new Date(date);
  const formattedDate = format(visitDate, "EEEE d MMM");
  const endTime = duration ? calculateEndTime(time, duration) : null;
  const timeDisplay = endTime ? `${time} - ${endTime}` : time;

  return (
    <div className="flex gap-2">
      <div className="bg-[#F2F2F2] rounded-full px-3 py-1.5 inline-flex items-center gap-1.5">
        <Calendar className="h-4 w-4 text-foreground" />
        <span className="text-xs font-semibold leading-heading text-foreground">{formattedDate}</span>
      </div>
      <div className="bg-[#F2F2F2] rounded-full px-3 py-1.5 inline-flex items-center gap-1.5">
        <Clock className="h-4 w-4 text-foreground" />
        <span className="text-xs font-semibold leading-heading text-foreground">{timeDisplay}</span>
      </div>
    </div>
  );
}

// Helper to calculate end time based on start time and duration
function calculateEndTime(startTime: string, duration: string): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  
  // Parse duration (e.g., "30m", "1h", "1h 30m")
  let totalMinutes = 0;
  const hourMatch = duration.match(/(\d+)h/);
  const minMatch = duration.match(/(\d+)m/);
  
  if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
  if (minMatch) totalMinutes += parseInt(minMatch[1]);
  
  const endHours = Math.floor((hours * 60 + minutes + totalMinutes) / 60) % 24;
  const endMinutes = (minutes + totalMinutes) % 60;
  
  return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
}
