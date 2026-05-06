import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Eye, Share2, Calendar, Phone, TrendingUp, Users, ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { OpportunityType } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, Tooltip, ResponsiveContainer, YAxis } from "recharts";

const opportunityColorMap: Record<OpportunityType, string> = {
  sell: "hsl(var(--huspy-sell))",
  buy: "hsl(var(--huspy-buy))",
  rent: "hsl(var(--huspy-rent))",
  lease: "hsl(var(--huspy-lease))",
  mortgage: "hsl(var(--accent-teal))",
};

interface OpportunityStatsWidgetProps {
  opportunityType: OpportunityType;
  className?: string;
}

// Animated counter hook
function useAnimatedCounter(target: number, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setHasStarted(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!hasStarted) return;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration, hasStarted]);

  return value;
}

// Recharts-based activity chart
function ActivityChart({ data, color, animate }: { data: number[]; color: string; animate: boolean }) {
  const chartData = useMemo(() => data.map((value, i) => ({ idx: i, value })), [data]);
  const gradientId = `chartGrad-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className="w-full h-16">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div
                  className="px-2 py-1 rounded-lg text-[10px] font-semibold text-white shadow-md"
                  style={{ backgroundColor: color }}
                >
                  {payload[0].value}
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{
              r: 4,
              fill: "white",
              stroke: color,
              strokeWidth: 2,
            }}
            isAnimationActive={animate}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Animated funnel step with staggered bar fill and opacity gradient
function FunnelStep({
  label,
  count,
  total,
  color,
  isLast,
  delay,
  animate,
  stepIndex,
  totalSteps,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  isLast?: boolean;
  delay: number;
  animate: boolean;
  stepIndex: number;
  totalSteps: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const displayCount = useAnimatedCounter(count, 800, delay);
  const [fillWidth, setFillWidth] = useState(0);
  // Opacity goes from low (first step) to high (last step): 0.25 → 1.0
  const barOpacity = totalSteps > 1
    ? 0.25 + (stepIndex / (totalSteps - 1)) * 0.75
    : 1;

  useEffect(() => {
    if (animate) {
      const timeout = setTimeout(() => setFillWidth(pct), delay);
      return () => clearTimeout(timeout);
    }
  }, [animate, pct, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: delay / 1000, ease: [0.32, 0.72, 0, 1] }}
      className="flex items-center gap-2"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-fg-primary leading-body truncate">{label}</span>
          <span className="text-xs font-semibold text-fg-primary leading-body tabular-nums">{displayCount}</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-raised overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${fillWidth}%`,
              backgroundColor: color,
              opacity: barOpacity,
              transition: 'width 0.8s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          />
        </div>
      </div>
      {!isLast && (
        <ArrowRight className="w-3 h-3 text-fg-disabled shrink-0" />
      )}
    </motion.div>
  );
}

// Animated metric card
function MetricCard({
  label,
  value,
  icon: Icon,
  change,
  positive,
  delay,
  onClick,
  isExpanded,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  change: string;
  positive: boolean;
  delay: number;
  onClick?: () => void;
  isExpanded?: boolean;
}) {
  const displayValue = useAnimatedCounter(value, 1000, delay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay / 1000, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        "space-y-1 p-2.5 rounded-xl cursor-pointer transition-colors duration-200",
        "hover:bg-surface-raised",
        isExpanded && "bg-surface-raised"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-fg-secondary" />
        <span className="text-xs text-fg-secondary leading-body">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-semibold text-fg-primary leading-heading tabular-nums">
          {displayValue}
        </span>
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: (delay + 600) / 1000 }}
          className={cn(
            "text-[10px] font-semibold leading-body",
            positive ? "text-ds-green" : "text-ds-red"
          )}
        >
          {change}
        </motion.span>
      </div>
    </motion.div>
  );
}

type TimePeriod = 'all' | '7d' | '30d' | '90d';

const periodLabels: Record<TimePeriod, string> = {
  'all': 'All time',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
};

const sparklineLabels: Record<TimePeriod, string> = {
  'all': 'Monthly',
  '7d': 'Daily',
  '30d': 'Weekly',
  '90d': 'Monthly',
};

const periods: TimePeriod[] = ['all', '7d', '30d', '90d'];
const periodCount = periods.length;

function PeriodSelector({ value, onChange }: { value: TimePeriod; onChange: (v: TimePeriod) => void }) {
  const activeIndex = periods.indexOf(value);
  return (
    <div className="relative flex bg-surface-raised rounded-full p-0.5">
      {/* Animated sliding indicator */}
      <motion.div
        className="absolute top-0.5 bottom-0.5 rounded-full bg-fg-primary"
        initial={false}
        animate={{
          left: `calc(${activeIndex} * (100% / ${periodCount}) + 2px)`,
          width: `calc(100% / ${periodCount} - 4px)`,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
      {periods.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "relative z-10 px-2.5 py-1 text-[10px] font-semibold rounded-full transition-colors duration-200",
            value === p
              ? "text-white"
              : "text-fg-secondary hover:text-fg-primary"
          )}
          style={{ width: `calc(100% / ${periodCount})` }}
        >
          {p === 'all' ? 'All' : p}
        </button>
      ))}
    </div>
  );
}

// Generate mock data scaled by period
function generateStats(isSellLease: boolean, period: TimePeriod, color: string) {
  const multipliers: Record<TimePeriod, number> = { 'all': 20, '7d': 1, '30d': 3.2, '90d': 8.5 };
  const m = multipliers[period];

  if (isSellLease) {
    return {
      metrics: [
        { label: "Views", value: Math.round(82 * m), icon: Eye, change: period === '7d' ? "+12%" : period === '30d' ? "+28%" : period === '90d' ? "+64%" : "+120%", positive: true },
        { label: "Inquiries", value: Math.round(4 * m), icon: Users, change: period === '7d' ? "+3" : period === '30d' ? "+8" : period === '90d' ? "+19" : "+45", positive: true },
        { label: "Visits", value: Math.round(2 * m), icon: Calendar, change: period === '7d' ? "2 upcoming" : period === '30d' ? "1 upcoming" : "—", positive: true },
        { label: "Shared", value: Math.round(6 * m), icon: Share2, change: period === '7d' ? "+5" : period === '30d' ? "+12" : period === '90d' ? "+31" : "+72", positive: true },
      ],
      funnel: {
        steps: [
          { label: "Inquiries", count: Math.round(4 * m) },
          { label: "Contacted", count: Math.round(3 * m) },
          { label: "Visited", count: Math.round(2 * m) },
          { label: "Offers", count: Math.round(0.5 * m) },
        ],
        color,
      },
      weeklyActivity: period === '7d'
        ? [5, 8, 3, 11, 6, 9, 7]
        : period === '30d'
          ? [3, 5, 2, 8, 6, 4, 7, 9, 5, 11, 8, 6]
          : period === '90d'
            ? [12, 18, 15, 22, 19, 25, 28, 24, 30]
            : [20, 28, 35, 30, 42, 38, 50, 45, 55, 60, 52, 65],
      breakdowns: {
        "Views": period === '7d'
          ? [{ label: "Idealista", value: 47 }, { label: "Fotocasa", value: 22 }, { label: "Direct", value: 13 }]
          : period === '30d'
            ? [{ label: "Idealista", value: 148 }, { label: "Fotocasa", value: 72 }, { label: "Direct", value: 42 }]
            : period === '90d'
              ? [{ label: "Idealista", value: 398 }, { label: "Fotocasa", value: 187 }, { label: "Direct", value: 112 }]
              : [{ label: "Idealista", value: 940 }, { label: "Fotocasa", value: 440 }, { label: "Direct", value: 260 }],
        "Inquiries": period === '7d'
          ? [{ label: "Phone", value: 2 }, { label: "WhatsApp", value: 1 }, { label: "Email", value: 1 }]
          : period === '30d'
            ? [{ label: "Phone", value: 6 }, { label: "WhatsApp", value: 4 }, { label: "Email", value: 3 }]
            : period === '90d'
              ? [{ label: "Phone", value: 16 }, { label: "WhatsApp", value: 11 }, { label: "Email", value: 7 }]
              : [{ label: "Phone", value: 38 }, { label: "WhatsApp", value: 26 }, { label: "Email", value: 16 }],
        "Visits": [{ label: "Completed", value: Math.max(1, Math.round(1.5 * m)) }, { label: "Upcoming", value: (period === '90d' || period === 'all') ? 0 : Math.round(0.5 * m) }],
        "Shared": [{ label: "WhatsApp", value: Math.round(3 * m) }, { label: "Email", value: Math.round(2 * m) }, { label: "Link", value: Math.round(1 * m) }],
      } as Record<string, { label: string; value: number }[]>,
    };
  }
  return {
      metrics: [
        { label: "Shared", value: Math.round(7 * m), icon: Share2, change: period === '7d' ? "+8" : period === '30d' ? "+18" : period === '90d' ? "+42" : "+95", positive: true },
        { label: "Visits", value: Math.round(1.5 * m), icon: Calendar, change: period === '7d' ? "1 upcoming" : period === '30d' ? "2 upcoming" : "—", positive: true },
        { label: "Calls", value: Math.round(3 * m), icon: Phone, change: period === '7d' ? "+2" : period === '30d' ? "+7" : period === '90d' ? "+15" : "+35", positive: true },
        { label: "Saved", value: Math.round(3.5 * m), icon: TrendingUp, change: period === '7d' ? "+3" : period === '30d' ? "+9" : period === '90d' ? "+21" : "+48", positive: true },
      ],
      funnel: {
        steps: [
          { label: "Saved", count: Math.round(3.5 * m) },
          { label: "Shared", count: Math.round(2.5 * m) },
          { label: "Visited", count: Math.round(1.5 * m) },
          { label: "Offers", count: Math.max(1, Math.round(0.3 * m)) },
        ],
        color,
      },
      weeklyActivity: period === '7d'
        ? [3, 6, 4, 8, 5, 7, 9]
        : period === '30d'
          ? [2, 4, 3, 6, 5, 3, 7, 4, 6, 8, 5, 9]
          : period === '90d'
            ? [8, 12, 10, 16, 14, 18, 22, 19, 24]
            : [15, 20, 18, 25, 22, 30, 35, 32, 40, 38, 42, 48],
      breakdowns: {
        "Shared": [{ label: "WhatsApp", value: Math.round(3.5 * m) }, { label: "Email", value: Math.round(2 * m) }, { label: "Link", value: Math.round(1.5 * m) }],
        "Calls": [{ label: "Outbound", value: Math.round(2 * m) }, { label: "Inbound", value: Math.round(1 * m) }],
        "Saved": period === '7d'
          ? [{ label: "Today", value: 1 }, { label: "This week", value: 3 }]
          : period === '30d'
            ? [{ label: "This week", value: 3 }, { label: "Last week", value: 4 }, { label: "Older", value: 4 }]
            : [{ label: "This month", value: 8 }, { label: "Last month", value: 11 }, { label: "Older", value: 11 }],
        "Visits": [{ label: "Completed", value: Math.max(1, Math.round(1 * m)) }, { label: "Upcoming", value: (period === '90d' || period === 'all') ? 0 : Math.max(1, Math.round(0.5 * m)) }],
      } as Record<string, { label: string; value: number }[]>,
  };
}

export function OpportunityStatsWidget({ opportunityType, className }: OpportunityStatsWidgetProps) {
  const isSellLease = opportunityType === "sell" || opportunityType === "lease";
  const typeColor = opportunityColorMap[opportunityType];
  const [hasAnimated, setHasAnimated] = useState(false);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [showFunnel, setShowFunnel] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>('30d');
  const [animKey, setAnimKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Trigger animations on mount via IntersectionObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setHasAnimated(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const stats = useMemo(() => generateStats(isSellLease, period, typeColor), [isSellLease, period, typeColor]);

  const totalFunnel = stats.funnel.steps[0].count;

  const handlePeriodChange = useCallback((p: TimePeriod) => {
    setPeriod(p);
    setAnimKey(prev => prev + 1);
    setExpandedMetric(null);
  }, []);

  const toggleMetric = useCallback((label: string) => {
    setExpandedMetric(prev => prev === label ? null : label);
  }, []);

  const getMetricBreakdown = useCallback((label: string) => {
    return stats.breakdowns[label] || [];
  }, [stats.breakdowns]);

  return (
    <Card ref={containerRef} className={cn("p-5 space-y-5 overflow-hidden", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-fg-secondary uppercase tracking-wide">Overview</h3>
        <PeriodSelector value={period} onChange={handlePeriodChange} />
      </div>

      {/* Metric grid */}
      {hasAnimated && (
        <motion.div
          key={`metrics-${animKey}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 gap-1"
        >
          {stats.metrics.map((m, i) => (
            <div key={m.label}>
              <MetricCard
                {...m}
                delay={i * 120}
                onClick={() => toggleMetric(m.label)}
                isExpanded={expandedMetric === m.label}
              />
              <AnimatePresence>
                {expandedMetric === m.label && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-2.5 pb-2 space-y-1">
                      {getMetricBreakdown(m.label).map((b) => (
                        <div key={b.label} className="flex items-center justify-between">
                          <span className="text-[10px] text-fg-secondary">{b.label}</span>
                          <span className="text-[10px] font-semibold text-fg-primary tabular-nums">{b.value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      )}

      {/* Engagement timeline sparkline */}
      {hasAnimated && (
        <motion.div
          key={`spark-${animKey}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-2 pt-3 border-t border-border-primary"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fg-secondary leading-body">{sparklineLabels[period]} activity</span>
            <span className="text-[10px] text-fg-secondary leading-body">{periodLabels[period]}</span>
          </div>
          <ActivityChart key={`chart-${animKey}`} data={stats.weeklyActivity} color={stats.funnel.color} animate={true} />
        </motion.div>
      )}

      {/* Conversion funnel - collapsible */}
      {hasAnimated && (
        <div className="space-y-3 pt-3 border-t border-border-primary">
          <button
            className="flex items-center justify-between w-full group"
            onClick={() => setShowFunnel(prev => !prev)}
          >
            <span className="text-xs font-semibold text-fg-secondary leading-body">Conversion funnel</span>
            <ChevronDown className={cn(
              "w-3.5 h-3.5 text-fg-secondary transition-transform duration-300",
              !showFunnel && "-rotate-90"
            )} />
          </button>
          <AnimatePresence initial={false}>
            {showFunnel && (
              <motion.div
                key={`funnel-${animKey}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-2.5">
                  {stats.funnel.steps.map((step, i) => (
                    <FunnelStep
                      key={`${step.label}-${animKey}`}
                      label={step.label}
                      count={step.count}
                      total={totalFunnel}
                      color={stats.funnel.color}
                      isLast={i === stats.funnel.steps.length - 1}
                      delay={200 + i * 150}
                      animate={true}
                      stepIndex={i}
                      totalSteps={stats.funnel.steps.length}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
}