import { useState } from "react";
import { format, addDays, subDays, isSameDay, isToday, startOfWeek, eachDayOfInterval, isSameMonth, startOfMonth, endOfMonth, addMonths, subMonths, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WeekCalendarPickerProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  variant?: "week" | "month" | "compact";
}

export function WeekCalendarPicker({ 
  selectedDate, 
  onSelectDate,
  variant = "week"
}: WeekCalendarPickerProps) {
  const [viewDate, setViewDate] = useState(selectedDate);

  // Check if current view includes today
  const todayDate = new Date();
  const startOfCurrentWeek = startOfWeek(viewDate, { weekStartsOn: 1 });
  const endOfCurrentWeek = addDays(startOfCurrentWeek, 6);
  const isTodayInView = todayDate >= startOfCurrentWeek && todayDate <= endOfCurrentWeek;

  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    onSelectDate(today);
  };

  if (variant === "month") {
    return (
      <MonthCalendar 
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        viewDate={viewDate}
        setViewDate={setViewDate}
      />
    );
  }

  if (variant === "compact") {
    return (
      <CompactWeekCalendar
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        viewDate={viewDate}
        setViewDate={setViewDate}
      />
    );
  }

  // Week view
  const days = eachDayOfInterval({
    start: startOfCurrentWeek,
    end: endOfCurrentWeek
  });

  const goToPreviousWeek = () => setViewDate(subDays(viewDate, 7));
  const goToNextWeek = () => setViewDate(addDays(viewDate, 7));

  return (
    <div className="space-y-2">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {format(days[0], "MMM d")} - {format(days[6], "MMM d, yyyy")}
          </span>
          {!isTodayInView && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 text-xs px-2"
              onClick={goToToday}
            >
              Today
            </Button>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Days */}
      <div className="flex gap-1">
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-smooth",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isTodayDate
                  ? "border border-border"
                  : "hover:bg-muted"
              )}
            >
              <span className={cn(
                "text-[10px] font-medium uppercase",
                isSelected ? "text-primary-foreground" : "text-muted-foreground"
              )}>
                {isTodayDate ? "Today" : format(day, "EEE")}
              </span>
              <span className={cn(
                "text-lg font-semibold",
                isSelected ? "text-primary-foreground" : "text-foreground"
              )}>
                {format(day, "d")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface CompactWeekCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  viewDate: Date;
  setViewDate: (date: Date) => void;
}

function CompactWeekCalendar({ selectedDate, onSelectDate, viewDate, setViewDate }: CompactWeekCalendarProps) {
  const startOfCurrentWeek = startOfWeek(viewDate, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({
    start: startOfCurrentWeek,
    end: addDays(startOfCurrentWeek, 6)
  });

  return (
    <div className="grid grid-cols-7 w-full">
      {days.map((day) => {
        const isSelected = isSameDay(day, selectedDate);
        const isTodayDate = isToday(day);
        
        return (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDate(day)}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200",
              isSelected
                ? "bg-card border border-border"
                : "hover:bg-muted"
            )}
          >
            <span className={cn(
              "text-xs font-semibold leading-heading text-center",
              isSelected ? "text-foreground" : "text-fg-disabled"
            )}>
              {isTodayDate ? "Today" : format(day, "EEE")}
            </span>
            <span className={cn(
              "text-lg font-semibold leading-heading text-center",
              isSelected ? "text-foreground" : "text-fg-disabled"
            )}>
              {format(day, "d")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface MonthCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  viewDate: Date;
  setViewDate: (date: Date) => void;
}

function MonthCalendar({ selectedDate, onSelectDate, viewDate, setViewDate }: MonthCalendarProps) {
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Check if current month view includes today
  const todayDate = new Date();
  const isTodayInView = isSameMonth(todayDate, viewDate);

  const goToPreviousMonth = () => setViewDate(subMonths(viewDate, 1));
  const goToNextMonth = () => setViewDate(addMonths(viewDate, 1));
  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    onSelectDate(today);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {format(viewDate, "MMMM yyyy")}
          </span>
          {!isTodayInView && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 text-xs px-2"
              onClick={goToToday}
            >
              Today
            </Button>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-[10px] font-medium text-muted-foreground uppercase py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const isCurrentMonth = isSameMonth(day, viewDate);
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                "aspect-square flex items-center justify-center text-sm rounded-lg transition-smooth",
                isSelected
                  ? "bg-primary text-primary-foreground font-semibold"
                  : isTodayDate
                  ? "border border-border font-medium"
                  : isCurrentMonth
                  ? "hover:bg-muted"
                  : "text-muted-foreground/50 hover:bg-muted/50"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
