import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type RangeMode = 'all' | 'custom';

interface DealsFilterBarProps {
  onDateRangeChange: (range: { from: Date; to: Date } | null) => void;
}

export function DealsFilterBar({ onDateRangeChange }: DealsFilterBarProps) {
  const [mode, setMode] = useState<RangeMode>('all');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const range = useMemo(() => {
    if (mode === 'custom' && customFrom && customTo) return { from: customFrom, to: customTo };
    return null;
  }, [mode, customFrom, customTo]);

  useEffect(() => { onDateRangeChange(range); }, [range, onDateRangeChange]);

  const handleModeChange = (m: RangeMode) => {
    setMode(m);
    if (m !== 'custom') { setCustomFrom(undefined); setCustomTo(undefined); }
  };

  const pillClass = (active: boolean) => cn(
    'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
    active
      ? 'bg-foreground text-background'
      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={() => handleModeChange('all')} className={pillClass(mode === 'all')}>
        All
      </button>
      <button onClick={() => handleModeChange('custom')} className={pillClass(mode === 'custom')}>
        Custom
      </button>
      {mode === 'custom' && (
        <div className="flex items-center gap-2">
          <Popover open={fromOpen} onOpenChange={setFromOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full text-xs font-semibold bg-secondary border-0">
                <CalendarIcon className="h-3.5 w-3.5" />
                {customFrom ? format(customFrom, 'MMM d, yyyy') : 'From'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customFrom} onSelect={(d) => { setCustomFrom(d); setFromOpen(false); }} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">–</span>
          <Popover open={toOpen} onOpenChange={setToOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full text-xs font-semibold bg-secondary border-0">
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
