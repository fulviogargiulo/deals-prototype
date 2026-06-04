import { useState } from 'react';
import { Wallet, ChevronRight, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { InvoiceDetailModal } from '@/components/modals/invoice-detail-modal';
import { StatementOfAccount } from '@/types';

interface ExpectedPayoutSectionProps {
  statement: StatementOfAccount;
  title?: string;
}

function getPaymentStatusLabel(status: string) {
  if (status === 'paid') return { label: 'Paid', color: 'hsl(var(--tier-success-fg))', bg: 'hsl(var(--tier-success-bg))' };
  if (status === 'confirmed') return { label: 'Payment Pending', color: 'hsl(var(--tier-info-fg))', bg: 'hsl(var(--tier-info-bg))' };
  return { label: 'In Review', color: 'hsl(var(--tier-warning-fg))', bg: 'hsl(var(--tier-warning-bg))' };
}

function getDueDate(statement: StatementOfAccount) {
  const due = new Date(new Date(statement.generatedAt).getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const isOverdue = now > due;
  const formatted = due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return { due, isOverdue, formatted };
}

export function ExpectedPayoutSection({ statement, title = 'Expected Payout' }: ExpectedPayoutSectionProps) {
  const [showInvoice, setShowInvoice] = useState(false);
  const statusConfig = getPaymentStatusLabel(statement.status);
  const { isOverdue, formatted: dueDateFormatted } = getDueDate(statement);

  return (
    <>
      <div
        className="bg-card rounded-2xl overflow-hidden cursor-pointer hover:bg-secondary/50 transition-colors"
        onClick={() => setShowInvoice(true)}
      >
        {/* Section header inside card */}
        <div className="px-6 pt-5 pb-0">
          <h3 className="text-[16px] font-semibold leading-[120%] text-foreground">
            {title}
          </h3>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-secondary">
                <Wallet className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-semibold leading-[140%] text-muted-foreground">
                    {statement.cycleLabel} Cycle
                  </p>
                  <Badge
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold border-0"
                    style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                  >
                    {statusConfig.label}
                  </Badge>
                  {isOverdue && statement.status !== 'paid' && (
                    <Badge
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold border-0"
                      style={{ backgroundColor: 'hsl(var(--tier-danger-bg))', color: 'hsl(var(--tier-danger-fg))' }}
                    >
                      Overdue
                    </Badge>
                  )}
                </div>
                <p className="text-[32px] font-semibold leading-[120%] tabular-nums text-tier-success">
                  €{statement.balance.toLocaleString()}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className={`text-[12px] font-semibold leading-[140%] ${isOverdue ? 'text-tier-danger' : 'text-muted-foreground'}`}>
                    Due {dueDateFormatted}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="text-[12px] font-semibold leading-[140%]">View Details</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      <InvoiceDetailModal
        open={showInvoice}
        onOpenChange={setShowInvoice}
        statement={statement}
      />
    </>
  );
}
