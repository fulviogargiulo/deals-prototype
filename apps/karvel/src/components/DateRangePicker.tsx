import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  format, startOfMonth, startOfWeek, endOfWeek, addMonths, subMonths,
  isSameMonth, isSameDay, isWithinInterval, startOfYear, subYears,
  eachDayOfInterval, startOfDay, endOfDay, isAfter, isBefore, addDays
} from "date-fns";

export type TimePeriod = "Week" | "MTD" | "YTD" | "Last 12M" | "Custom";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export function getPresetRange(preset: Exclude<TimePeriod, "Custom">): { from: Date; to: Date } {
  const today = new Date();
  switch (preset) {
    case "Week":
      return { from: startOfWeek(today, { weekStartsOn: 0 }), to: today };
    case "MTD":
      return { from: startOfMonth(today), to: today };
    case "YTD":
      return { from: startOfYear(today), to: today };
    case "Last 12M":
      return { from: subYears(today, 1), to: today };
  }
}

interface DateRangePickerProps {
  dateRange: DateRange;
  timePeriod: TimePeriod;
  onDateRangeChange: (range: DateRange) => void;
  onTimePeriodChange: (period: TimePeriod) => void;
}

export function DateRangePicker({ dateRange, timePeriod, onDateRangeChange, onTimePeriodChange }: DateRangePickerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()));
  const [selectingStart, setSelectingStart] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handlePreset = (preset: Exclude<TimePeriod, "Custom">) => {
    onTimePeriodChange(preset);
    onDateRangeChange(getPresetRange(preset));
  };

  const handleDayClick = (day: Date) => {
    if (selectingStart) {
      onDateRangeChange({ from: day, to: null });
      setSelectingStart(false);
      onTimePeriodChange("Custom");
    } else {
      if (dateRange.from && isBefore(day, dateRange.from)) {
        onDateRangeChange({ from: day, to: dateRange.from });
      } else {
        onDateRangeChange({ from: dateRange.from, to: day });
      }
      setSelectingStart(true);
      onTimePeriodChange("Custom");
    }
  };

  const month1 = calendarMonth;
  const month2 = addMonths(calendarMonth, 1);

  const triggerLabel = dateRange.from && dateRange.to
    ? `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`
    : dateRange.from
      ? `${format(dateRange.from, "MMM d, yyyy")} – ...`
      : timePeriod;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setCalendarOpen(!calendarOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-border bg-card rounded-md text-[13px] font-medium text-foreground hover:bg-muted transition-colors min-w-[260px]"
      >
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        {triggerLabel}
      </button>

      {calendarOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-popover border border-border rounded-lg shadow-lg p-5 w-auto">
          <div className="flex gap-2 mb-4">
            {(["Week", "MTD", "YTD", "Last 12M"] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => handlePreset(preset)}
                className={`px-4 py-2 rounded-md text-[13px] font-medium border transition-colors ${
                  timePeriod === preset
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex gap-8">
            <MonthCalendar
              month={month1}
              dateRange={dateRange}
              onDayClick={handleDayClick}
              onPrev={() => setCalendarMonth(subMonths(calendarMonth, 1))}
              showPrev
            />
            <MonthCalendar
              month={month2}
              dateRange={dateRange}
              onDayClick={handleDayClick}
              onNext={() => setCalendarMonth(addMonths(calendarMonth, 1))}
              showNext
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Month Calendar ---- */
function MonthCalendar({ month, dateRange, onDayClick, onPrev, onNext, showPrev, showNext }: {
  month: Date;
  dateRange: DateRange;
  onDayClick: (day: Date) => void;
  onPrev?: () => void;
  onNext?: () => void;
  showPrev?: boolean;
  showNext?: boolean;
}) {
  const monthStart = startOfMonth(month);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const lastDay = endOfWeek(addDays(addMonths(monthStart, 1), -1), { weekStartsOn: 0 });
  const allDays = eachDayOfInterval({ start: calStart, end: lastDay });
  while (allDays.length < 42) {
    allDays.push(addDays(allDays[allDays.length - 1], 1));
  }
  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const today = startOfDay(new Date());

  return (
    <div className="w-[280px]">
      <div className="flex items-center justify-between mb-3">
        {showPrev ? (
          <button onClick={onPrev} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : <div className="w-7" />}
        <span className="text-[14px] font-semibold text-foreground">
          {format(month, "MMMM yyyy")}
        </span>
        {showNext ? (
          <button onClick={onNext} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : <div className="w-7" />}
      </div>

      <div className="grid grid-cols-7 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-[12px] font-medium text-muted-foreground py-1.5">{d}</div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((day, di) => {
            const isCurrentMonth = isSameMonth(day, month);
            const isToday = isSameDay(day, today);
            const isFrom = dateRange.from && isSameDay(day, dateRange.from);
            const isTo = dateRange.to && isSameDay(day, dateRange.to);
            const isSelected = isFrom || isTo;
            const isInRange = dateRange.from && dateRange.to &&
              isAfter(day, startOfDay(dateRange.from)) && isBefore(day, endOfDay(dateRange.to)) && !isSelected;

            return (
              <button
                key={di}
                onClick={() => onDayClick(day)}
                className={`
                  h-9 w-full text-[13px] transition-colors relative
                  ${!isCurrentMonth ? "text-muted-foreground/40" : "text-foreground"}
                  ${isInRange ? "bg-primary/15" : ""}
                  ${isSelected ? "bg-primary text-primary-foreground font-semibold" : ""}
                  ${isFrom && !isTo ? "rounded-l-md" : ""}
                  ${isTo && !isFrom ? "rounded-r-md" : ""}
                  ${isFrom && isTo ? "rounded-md" : ""}
                  ${isToday && !isSelected ? "bg-accent font-semibold" : ""}
                  ${!isSelected && isCurrentMonth ? "hover:bg-muted" : ""}
                `}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
