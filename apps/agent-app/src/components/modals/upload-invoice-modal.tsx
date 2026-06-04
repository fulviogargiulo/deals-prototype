import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatementOfAccount } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { createInvoice } from '@/data/earningsStore';
import { sharedAgents } from '@huspy/shared-domain';

const IVA_OPTIONS = [0, 7, 10, 15, 21, 22];
const IRPF_OPTIONS = [0, 7, 15];

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
  const [ivaRate, setIvaRate] = useState(21);
  const [irpfRate, setIrpfRate] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subtotal = Math.round(
    statement.lineItems.reduce((sum, l) => sum + (l.type === 'credit' ? l.amount : -l.amount), 0) * 100
  ) / 100;

  const vatAmount = Math.round(subtotal * (ivaRate / 100) * 100) / 100;
  const withholdingAmount = Math.round(subtotal * (irpfRate / 100) * 100) / 100;
  const grossAmount = Math.round((subtotal + vatAmount) * 100) / 100;
  const netPayout = Math.round((grossAmount - withholdingAmount) * 100) / 100;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) setFileName(file.name);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const canSubmit = fileName !== null && subtotal > 0;

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
      statement.lineItems.map(l => l.id)
    );
    setIsCreated(true);
    toast.success('Invoice uploaded and submitted for review');
    onInvoiceCreated?.();
  };

  const handleClose = (openState: boolean) => {
    if (!openState) setTimeout(() => { setIsCreated(false); setFileName(null); setIvaRate(21); setIrpfRate(0); }, 300);
    onOpenChange(openState);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl max-h-[90vh] flex flex-col">
        <DialogTitle className="sr-only">Upload your invoice</DialogTitle>

        <div className="overflow-y-auto flex-1">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-[20px] font-semibold leading-[120%] text-foreground">Upload your invoice</h2>
                <p className="text-[12px] font-semibold leading-[140%] text-muted-foreground">Statement: {statement.cycleLabel}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* File upload */}
            <div>
              <p className="text-[12px] font-semibold text-muted-foreground mb-2">Invoice file</p>
              {fileName ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-secondary">
                  <FileText className="w-5 h-5 shrink-0 text-muted-foreground" />
                  <span className="text-[14px] font-semibold text-foreground flex-1 truncate">{fileName}</span>
                  <button onClick={() => setFileName(null)}>
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border rounded-xl px-6 py-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-[14px] font-semibold text-foreground">Drop your invoice PDF here</p>
                  <p className="text-[12px] text-muted-foreground mt-1">or click to browse</p>
                  <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg" className="hidden" onChange={handleFileChange} />
                </div>
              )}
            </div>

            {/* Tax breakdown */}
            <div>
              <p className="text-[12px] font-semibold text-muted-foreground mb-3">Tax breakdown</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground">Subtotal (base imponible)</span>
                  <span className="text-[13px] font-semibold tabular-nums text-foreground">€{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground">IVA</span>
                  <div className="flex items-center gap-2">
                    <Select value={String(ivaRate)} onValueChange={v => setIvaRate(Number(v))}>
                      <SelectTrigger className="h-7 text-[13px] rounded-lg w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {IVA_OPTIONS.map(r => (
                          <SelectItem key={r} value={String(r)}>{r}%</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-[13px] text-muted-foreground">= +€{vatAmount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground">IRPF withholding</span>
                  <div className="flex items-center gap-2">
                    <Select value={String(irpfRate)} onValueChange={v => setIrpfRate(Number(v))}>
                      <SelectTrigger className="h-7 text-[13px] rounded-lg w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {IRPF_OPTIONS.map(r => (
                          <SelectItem key={r} value={String(r)}>{r}%</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-[13px]" className="text-tier-danger">= −€{withholdingAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-xl px-4 py-3 flex items-center justify-between bg-secondary">
                <span className="text-[13px] font-semibold text-muted-foreground">Net payout to you</span>
                <span className="text-[20px] font-semibold tabular-nums text-tier-success">€{netPayout.toLocaleString()}</span>
              </div>
            </div>

            {/* Posting lines — all included, non-toggleable */}
            <div>
              <p className="text-[12px] font-semibold text-muted-foreground mb-2">
                Link to ledger lines
                <Badge className="ml-2 rounded-full text-[10px] px-2 border-0 bg-secondary text-muted-foreground">{statement.lineItems.length} selected</Badge>
              </p>
              <div className="space-y-1">
                {statement.lineItems.map(item => (
                  <div
                    key={item.id}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                  >
                    <div className="w-4 h-4 rounded-md border-2 border-primary bg-primary flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <span className="text-[13px] text-foreground flex-1 truncate">{item.description}</span>
                    <span
                      className="text-[13px] font-semibold tabular-nums shrink-0"
                      style={{ color: item.type === 'credit' ? 'hsl(var(--tier-success-fg))' : 'hsl(var(--tier-danger-fg))' }}
                    >
                      {item.type === 'credit' ? '+' : '−'}€{item.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="sticky bottom-0 px-6 py-4 border-t border-border bg-card">
          <Button
            className="w-full h-11 rounded-full text-[14px] font-semibold"
            style={{ backgroundColor: canSubmit ? 'hsl(var(--tier-success-fg))' : undefined, color: canSubmit ? 'white' : undefined }}
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
