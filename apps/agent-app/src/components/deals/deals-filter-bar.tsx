import { useState, useMemo, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks, startOfMonth, endOfMonth, subMonths, addMonths, startOfYear } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type RangeMode = 'weekly' | 'monthly' | 'ytd' | 'custom';

interface DealsFilterBarProps {
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export function DealsFilterBar({ onDateRangeChange }: DealsFilterBarProps) {
  const [mode, setMode] = useState<RangeMode>('weekly');
  const [anchor, setAnchor] = useState(new Date());
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const range = useMemo(() => {
    if (mode === 'weekly') return { from: startOfWeek(anchor, { weekStartsOn: 1 }), to: endOfWeek(anchor, { weekStartsOn: 1 }) };
    if (mode === 'monthly') return { from: startOfMonth(anchor), to: endOfMonth(anchor) };
    if (mode === 'ytd') return { from: startOfYear(new Date()), to: new Date() };
    if (customFrom && customTo) return { from: customFrom, to: customTo };
    return { from: startOfWeek(anchor, { weekStartsOn: 1 }), to: endOfWeek(anchor, { weekStartsOn: 1 }) };
  }, [mode, anchor, customFrom, customTo]);

  useEffect(() => { onDateRangeChange(range); }, [range, onDateRangeChange]);

  const goPrev = () => {
    if (mode === 'weekly') setAnchor(subWeeks(anchor, 1));
    else if (mode === 'monthly') setAnchor(subMonths(anchor, 1));
  };
  const goNext = () => {
    if (mode === 'weekly') setAnchor(addWeeks(anchor, 1));
    else if (mode === 'monthly') setAnchor(addMonths(anchor, 1));
  };

  const showNav = mode === 'weekly' || mode === 'monthly';

  const dateLabel = (() => {
    if (mode === 'weekly') return `${format(range.from, 'MMM d')} – ${format(range.to, 'MMM d, yyyy')}`;
    if (mode === 'monthly') return format(range.from, 'MMMM yyyy');
    if (mode === 'ytd') return `Jan 1 – ${format(new Date(), 'MMM d, yyyy')}`;
    if (customFrom && customTo) return `${format(customFrom, 'MMM d, yyyy')} – ${format(customTo, 'MMM d, yyyy')}`;
    return 'Select dates';
  })();

  const handleModeChange = (m: RangeMode) => {
    setMode(m);
    if (m !== 'custom') { setCustomFrom(undefined); setCustomTo(undefined); }
  };

  const modeLabels: Record<RangeMode, string> = { weekly: 'Weekly', monthly: 'Monthly', ytd: 'YTD', custom: 'Custom' };

  return (
    <div className="bg-card rounded-2xl px-4 py-3 flex items-center gap-3">
      {/* Segmented control */}
      <div className="flex items-center gap-0.5 bg-muted rounded-xl p-1 shrink-0">
        {(['weekly', 'monthly', 'ytd', 'custom'] as RangeMode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold leading-none transition-all duration-150',
              mode === m ? 'bg-card text-foreground shadow-sm' : 'text-fg-secondary hover:text-foreground'
            )}
          >
            {modeLabels[m]}
          </button>
        ))}
      </div>

      {/* Nav / label */}
      {showNav && (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-fg-secondary hover:text-foreground" onClick={goPrev}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-sm font-semibold text-foreground min-w-[158px] text-center tabular-nums">{dateLabel}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-fg-secondary hover:text-foreground" onClick={goNext}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      {mode === 'ytd' && (
        <span className="text-sm font-semibold text-foreground tabular-nums">{dateLabel}</span>
      )}
      {mode === 'custom' && (
        <div className="flex items-center gap-2">
          <Popover open={fromOpen} onOpenChange={setFromOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-xl text-xs font-semibold bg-muted border-0">
                <CalendarIcon className="h-3.5 w-3.5" />
                {customFrom ? format(customFrom, 'MMM d, yyyy') : 'From'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customFrom} onSelect={(d) => { setCustomFrom(d); setFromOpen(false); }} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-fg-secondary">–</span>
          <Popover open={toOpen} onOpenChange={setToOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-xl text-xs font-semibold bg-muted border-0">
                <CalendarIcon className="h-3.5 w-3.5" />
                {customTo ? format(customTo, 'MMM d, yyyy') : 'To'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={customTo} onSelect={(d) => { setCustomTo(d); setToOpen(false); }} disabled={(date) => customFrom ? date < customFrom : false} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
