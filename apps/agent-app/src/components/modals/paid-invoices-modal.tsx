import { Download, FileText, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Deal } from '@/types';
import { toast } from 'sonner';

interface PaidInvoicesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deals: Deal[];
  totalIncome: number;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function PaidInvoicesModal({ open, onOpenChange, deals, totalIncome }: PaidInvoicesModalProps) {
  const sortedDeals = [...deals].sort((a, b) => 
    new Date(b.paymentDate || b.reportDate).getTime() - new Date(a.paymentDate || a.reportDate).getTime()
  );

  const handleDownload = (deal: Deal, type: 'invoice' | 'receipt') => {
    toast.success(`Downloading ${type === 'invoice' ? 'Invoice' : 'Payment Receipt'} ${deal.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border-ds-primary">
          <DialogTitle className="text-[20px] font-semibold leading-[120%]">
            Paid Invoices
          </DialogTitle>
          <p className="text-[14px] font-normal leading-[140%] text-fg-secondary mt-1">
            {deals.length} invoices · Total earned{' '}
            <span className="font-semibold" style={{ color: 'hsl(var(--accent-teal))' }}>
              €{totalIncome.toLocaleString()}
            </span>
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {sortedDeals.map(deal => (
            <div
              key={deal.id}
              className="bg-surface-raised rounded-xl p-4 space-y-3"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold leading-[140%] text-foreground truncate">
                    {deal.title}
                  </p>
                  <p className="text-[12px] font-normal leading-[140%] text-fg-secondary">
                    {deal.clientName}
                  </p>
                </div>
                <p className="text-[16px] font-semibold leading-[140%] tabular-nums shrink-0" style={{ color: 'hsl(var(--ds-green))' }}>
                  €{deal.commissionAmount.toLocaleString()}
                </p>
              </div>

              {/* Dates row */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 text-[12px] font-normal leading-[140%]" style={{ color: 'hsl(var(--ds-green))' }}>
                  <Calendar className="w-3.5 h-3.5" />
                  Paid: {formatDate(deal.paymentDate)}
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[12px] font-semibold gap-1.5"
                  onClick={() => handleDownload(deal, 'invoice')}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Invoice
                  <Download className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[12px] font-semibold gap-1.5"
                  onClick={() => handleDownload(deal, 'receipt')}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Receipt
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
