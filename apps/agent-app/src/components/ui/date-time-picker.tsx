import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
  label: string;
  value?: { date: Date; time: string } | null;
  onChange: (value: { date: Date; time: string } | null) => void;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export function DateTimePicker({
  label,
  value,
  onChange,
  required = false,
  error = false,
  errorMessage,
  className
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value?.date);
  const [selectedHour, setSelectedHour] = useState(value?.time?.split(':')[0] || '09');
  const [selectedMinute, setSelectedMinute] = useState(value?.time?.split(':')[1] || '00');

  const hasValue = !!value;
  const isFloating = open || hasValue;

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      onChange({ date, time: `${selectedHour}:${selectedMinute}` });
    }
  };

  const handleTimeChange = (hour: string, minute: string) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    if (selectedDate) {
      onChange({ date: selectedDate, time: `${hour}:${minute}` });
    }
  };

  const formatDisplayValue = () => {
    if (!value) return '';
    const formattedDate = format(value.date, 'EEE d MMM');
    const [hour, minute] = value.time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'pm' : 'am';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${formattedDate} at ${displayHour}:${minute} ${ampm}`;
  };

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "relative w-full h-14 px-4 pt-4 pb-2 text-left rounded-xl border bg-background transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
              error
                ? "border-destructive focus:ring-destructive focus:border-destructive"
                : "border-input hover:border-muted-foreground/50",
              hasValue ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {/* Floating Label */}
            <span
              className={cn(
                "absolute left-4 transition-all duration-200 pointer-events-none",
                isFloating
                  ? "top-2 text-xs text-muted-foreground"
                  : "top-1/2 -translate-y-1/2 text-base"
              )}
            >
              {label}
              {required && <span className="text-destructive ml-0.5">*</span>}
            </span>

            {/* Value */}
            {hasValue && (
              <span className="text-base">{formatDisplayValue()}</span>
            )}

            {/* Calendar Icon */}
            <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 space-y-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              className="pointer-events-auto"
            />
            
            {/* Time Selection */}
            <div className="flex items-center gap-2 px-3 pb-2">
              <span className="text-sm text-muted-foreground">Time:</span>
              <Select value={selectedHour} onValueChange={(h) => handleTimeChange(h, selectedMinute)}>
                <SelectTrigger className="w-20 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">:</span>
              <Select value={selectedMinute} onValueChange={(m) => handleTimeChange(selectedHour, m)}>
                <SelectTrigger className="w-20 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MINUTES.map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="px-3 pb-2">
              <Button 
                size="sm" 
                className="w-full"
                disabled={!selectedDate}
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Error Message */}
      {error && errorMessage && (
        <p className="text-sm text-destructive mt-1 ml-1">{errorMessage}</p>
      )}
    </div>
  );
}
