import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatementOfAccount } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { createInvoice } from '@/data/earningsStore';
import { sharedAgents } from '@huspy/shared-domain';

interface UploadInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statement: StatementOfAccount;
  agentId: string;
  onInvoiceCreated?: () => void;
}

export function UploadInvoiceModal({ open, onOpenChange, statement, agentId, onInvoiceCreated }: UploadInvoiceModalProps) {
  const [isCreated, setIsCreated] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [subtotal, setSubtotal] = useState(statement.balance > 0 ? statement.balance : 0);
  const [ivaRate, setIvaRate] = useState(21);
  const [irpfRate, setIrpfRate] = useState(15);
  const [selectedLineIds, setSelectedLineIds] = useState<Set<string>>(
    new Set(statement.lineItems.map(l => l.id))
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const vatAmount = Math.round(subtotal * (ivaRate / 100) * 100) / 100;
  const withholdingAmount = Math.round(subtotal * (irpfRate / 100) * 100) / 100;
  const grossAmount = Math.round((subtotal + vatAmount) * 100) / 100;
  const netPayout = Math.round((grossAmount - withholdingAmount) * 100) / 100;

  const toggleLine = (id: string) => {
    setSelectedLineIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) setFileName(file.name);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const canSubmit = fileName !== null && selectedLineIds.size > 0 && subtotal > 0;

  const handleSubmit = () => {
    const now = new Date().toISOString();
    const agentPartyId = sharedAgents.find(a => a.id === agentId)?.partyId ?? agentId;
    createInvoice(
      {
        id: `inv-${Date.now()}`,
        direction: 'inbound',
        partyId: agentPartyId,
        invoiceNumber: fileName?.replace(/\.[^.]+$/, '') ?? `UPLOAD-${Date.now()}`,
        period: statement.period,
        status: 'issued',
        currency: 'EUR',
        subtotal,
        vatAmount,
        withholdingAmount,
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        createdAt: now,
        updatedAt: now,
      },
      Array.from(selectedLineIds)
    );
    setIsCreated(true);
    toast.success('Invoice uploaded and submitted for review');
    onInvoiceCreated?.();
  };

  const handleClose = (openState: boolean) => {
    if (!openState) setTimeout(() => { setIsCreated(false); setFileName(null); }, 300);
    onOpenChange(openState);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl max-h-[90vh] flex flex-col">
        <DialogTitle className="sr-only">Upload your invoice</DialogTitle>

        <div className="overflow-y-auto flex-1">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border-ds-primary">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--accent-teal) / 0.1)' }}>
                <Upload className="w-5 h-5" style={{ color: 'hsl(var(--accent-teal))' }} />
              </div>
              <div>
                <h2 className="text-[20px] font-semibold leading-[120%] text-foreground">Upload your invoice</h2>
                <p className="text-[12px] font-semibold leading-[140%] text-fg-secondary">Statement: {statement.cycleLabel}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* File upload */}
            <div>
              <p className="text-[12px] font-semibold text-fg-secondary uppercase tracking-wide mb-2">Invoice file</p>
              {fileName ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border-ds-primary bg-surface-ds-raised">
                  <FileText className="w-5 h-5 shrink-0" style={{ color: 'hsl(var(--accent-indigo))' }} />
                  <span className="text-[14px] font-semibold text-foreground flex-1 truncate">{fileName}</span>
                  <button onClick={() => setFileName(null)}>
                    <X className="w-4 h-4 text-fg-secondary hover:text-foreground transition-colors" />
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border-ds-primary rounded-xl px-6 py-8 text-center cursor-pointer hover:border-accent-indigo transition-colors"
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-fg-secondary" />
                  <p className="text-[14px] font-semibold text-foreground">Drop your invoice PDF here</p>
                  <p className="text-[12px] text-fg-secondary mt-1">or click to browse</p>
                  <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg" className="hidden" onChange={handleFileChange} />
                </div>
              )}
            </div>

            {/* Tax breakdown */}
            <div>
              <p className="text-[12px] font-semibold text-fg-secondary uppercase tracking-wide mb-3">Tax breakdown</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-fg-secondary">Subtotal (base imponible)</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] text-fg-secondary">€</span>
                    <Input
                      type="number"
                      value={subtotal}
                      onChange={e => setSubtotal(Number(e.target.value))}
                      className="h-7 text-[13px] rounded-lg w-24 text-right"
                      min={0}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-fg-secondary">IVA</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={ivaRate}
                      onChange={e => setIvaRate(Number(e.target.value))}
                      className="h-7 text-[13px] rounded-lg w-14 text-center"
                      min={0} max={30}
                    />
                    <span className="text-[13px] text-fg-secondary">% = +€{vatAmount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-fg-secondary">IRPF withholding</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={irpfRate}
                      onChange={e => setIrpfRate(Number(e.target.value))}
                      className="h-7 text-[13px] rounded-lg w-14 text-center"
                      min={0} max={25}
                    />
                    <span className="text-[13px]" style={{ color: 'hsl(var(--ds-red))' }}>% = −€{withholdingAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-xl px-4 py-3 flex items-center justify-between" style={{ backgroundColor: 'hsl(var(--accent-teal) / 0.1)' }}>
                <span className="text-[13px] font-semibold text-fg-secondary">Net payout to you</span>
                <span className="text-[20px] font-semibold tabular-nums" style={{ color: 'hsl(var(--accent-teal))' }}>€{netPayout.toLocaleString()}</span>
              </div>
            </div>

            {/* Posting line selection */}
            <div>
              <p className="text-[12px] font-semibold text-fg-secondary uppercase tracking-wide mb-2">
                Link to ledger lines
                <Badge className="ml-2 rounded-full text-[10px] px-2 border-0 bg-surface-ds-raised text-fg-secondary">{selectedLineIds.size} selected</Badge>
              </p>
              <div className="space-y-1">
                {statement.lineItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleLine(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-ds-raised transition-colors text-left"
                  >
                    <div
                      className="w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        borderColor: selectedLineIds.has(item.id) ? 'hsl(var(--accent-teal))' : 'hsl(var(--border-ds-primary))',
                        backgroundColor: selectedLineIds.has(item.id) ? 'hsl(var(--accent-teal))' : 'transparent',
                      }}
                    >
                      {selectedLineIds.has(item.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-[13px] text-foreground flex-1 truncate">{item.description}</span>
                    <span
                      className="text-[13px] font-semibold tabular-nums shrink-0"
                      style={{ color: item.type === 'credit' ? 'hsl(var(--ds-green))' : 'hsl(var(--ds-red))' }}
                    >
                      {item.type === 'credit' ? '+' : '−'}€{item.amount.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="sticky bottom-0 px-6 py-4 border-t border-border-ds-primary bg-card">
          <Button
            className="w-full h-11 rounded-full text-[14px] font-semibold"
            style={{ backgroundColor: canSubmit ? 'hsl(var(--ds-green))' : undefined, color: canSubmit ? 'white' : undefined }}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <Upload className="w-4 h-4 mr-2" />
            Submit invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
