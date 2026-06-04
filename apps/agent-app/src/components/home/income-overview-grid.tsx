import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { ArrowRight, TrendingUp } from "lucide-react";
import { getAgentDeals } from "@/data/mockDeals";
import { useDevTools } from "@/contexts/dev-tools-context";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function generateMonthlyIncome(deals: ReturnType<typeof getAgentDeals>) {
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const paidDeals = deals.filter(d => d.agentDealStatus === 'closed');
  const totalPaid = paidDeals.reduce((sum, d) => sum + (d.grossRevenue || 0), 0);
  const baseMonthly = totalPaid / 4;
  return months.map((month, i) => ({
    month,
    income: Math.round(baseMonthly * (0.6 + Math.random() * 0.8 + i * 0.1)),
  }));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-sm font-semibold text-muted-foreground">
          €{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export function IncomeOverviewGrid({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { activeAgentId } = useDevTools();
  const monthlyData = useMemo(() => generateMonthlyIncome(getAgentDeals(activeAgentId)), [activeAgentId]);
  const currentMonth = monthlyData[monthlyData.length - 1];
  const prevMonth = monthlyData[monthlyData.length - 2];
  const changePercent = prevMonth.income > 0
    ? (((currentMonth.income - prevMonth.income) / prevMonth.income) * 100).toFixed(1)
    : '0';
  const isPositive = parseFloat(changePercent) >= 0;

  return (
    <section className={cn("space-y-4 flex flex-col", className)}>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-semibold leading-[120%] text-foreground">My Income</h2>
        <button
          onClick={() => navigate('/income-details')}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Income card with chart */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4 flex-1 flex flex-col">
        {/* Summary row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-[140%] text-muted-foreground">This Month</p>
              <p className="text-2xl font-semibold leading-[120%] text-foreground">
                €{currentMonth.income.toLocaleString()}
              </p>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg",
            isPositive
              ? "text-tier-success bg-tier-success-bg"
              : "text-tier-danger bg-tier-danger-bg"
          )}>
            {isPositive ? '↑' : '↓'} {Math.abs(parseFloat(changePercent))}%
          </div>
        </div>

        {/* Chart */}
        <div className="h-[140px] w-full flex-1 min-h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--grey-900)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--grey-900)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'var(--grey-500)' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--grey-500)' }}
                tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="var(--grey-900)"
                strokeWidth={2}
                fill="url(#incomeGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
