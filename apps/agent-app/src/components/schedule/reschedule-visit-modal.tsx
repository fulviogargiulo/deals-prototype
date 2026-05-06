import { useState } from "react";
import { format } from "date-fns";
import { StandardModal } from "@/components/ui/standard-modal";
import { Button } from "@/components/ui/button";
import { FloatingLabelField } from "@/components/ui/floating-label-field";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { ScheduleActivity } from "@/types";
import { useSchedule } from "@/contexts/schedule-context";
import { toast } from "@/hooks/use-toast";

interface RescheduleVisitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ScheduleActivity;
}

const DURATION_OPTIONS = [
  { value: "30m", label: "30 min" },
  { value: "1h", label: "1 hour" },
  { value: "1h 30m", label: "1 hour 30 min" },
  { value: "2h", label: "2 hours" },
];

export function RescheduleVisitModal({ open, onOpenChange, activity }: RescheduleVisitModalProps) {
  const { rescheduleVisit } = useSchedule();
  
  const initialDate = new Date(activity.date);
  const [startValue, setStartValue] = useState<{ date: Date; time: string } | null>({
    date: initialDate,
    time: activity.time || "10:00",
  });
  const [duration, setDuration] = useState(activity.duration || "");

  const handleReschedule = () => {
    if (!startValue) return;

    const newDate = format(startValue.date, "yyyy-MM-dd");
    
    rescheduleVisit(activity.id, newDate, startValue.time);
    
    toast({
      title: "Visit rescheduled",
      description: `Rescheduled to ${format(startValue.date, "EEE d MMM")} at ${startValue.time}`,
    });
    
    onOpenChange(false);
  };

  return (
    <StandardModal
      open={open}
      onOpenChange={onOpenChange}
      title="Reschedule visit"
      description="Send a new invitation and reminder"
      size="md"
      footer={
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1 h-12 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-12 rounded-full"
            onClick={handleReschedule}
            disabled={!startValue}
          >
            Reschedule
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <DateTimePicker
          label="Start"
          required
          value={startValue}
          onChange={setStartValue}
        />

        <FloatingLabelField
          mode="select"
          label="Duration"
          value={duration}
          onValueChange={setDuration}
          options={DURATION_OPTIONS}
        />
      </div>
    </StandardModal>
  );
}
