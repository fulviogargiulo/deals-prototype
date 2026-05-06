import { useNavigate } from "react-router-dom";
import { ArrowRight, TrendingUp } from "lucide-react";
import { mockDeals } from "@/data/mockDeals";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Generate month-on-month income data from mock deals
function generateMonthlyIncome() {
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

  // Simulated monthly income based on mock deals spread across months
  const paidDeals = mockDeals.filter(d => d.status === 'paid');
  const totalPaid = paidDeals.reduce((sum, d) => sum + (d.commissionAmount || 0), 0);
  const baseMonthly = totalPaid / 4;

  const data = months.map((month, i) => ({
    month,
    income: Math.round(baseMonthly * (0.6 + Math.random() * 0.8 + i * 0.1)),
  }));

  return data;
}

const monthlyData = generateMonthlyIncome();
const currentMonth = monthlyData[monthlyData.length - 1];
const prevMonth = monthlyData[monthlyData.length - 2];
const changePercent = prevMonth.income > 0
  ? (((currentMonth.income - prevMonth.income) / prevMonth.income) * 100).toFixed(1)
  : '0';
const isPositive = parseFloat(changePercent) >= 0;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-sm font-semibold text-accent-ds-teal">
          €{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export function IncomeOverviewGrid({ className }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <section className={cn("space-y-4 flex flex-col", className)}>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-semibold leading-[120%] text-foreground">My Income</h2>
        <button
          onClick={() => navigate('/income-details')}
          className="text-sm font-medium text-fg-secondary hover:text-foreground transition-colors flex items-center gap-1"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Income card with chart */}
      <div className="bg-card rounded-2xl border border-border-ds-primary p-5 space-y-4 flex-1 flex flex-col">
        {/* Summary row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'hsl(var(--accent-teal) / 0.1)' }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: 'hsl(var(--accent-teal))' }} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-[140%] text-fg-secondary">This Month</p>
              <p className="text-2xl font-semibold leading-[120%] text-foreground">
                €{currentMonth.income.toLocaleString()}
              </p>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg",
            isPositive
              ? "text-ds-green bg-ds-green/10"
              : "text-ds-red bg-ds-red/10"
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
                  <stop offset="0%" stopColor="hsl(var(--accent-teal))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--accent-teal))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--fg-secondary))' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--fg-secondary))' }}
                tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="hsl(var(--accent-teal))"
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
