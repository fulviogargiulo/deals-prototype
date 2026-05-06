import { useState, useEffect } from 'react';
import { StatementOfAccount, LineItemIssue } from '@/types';
import { StandardModal } from '@/components/ui/standard-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface StatementDisputeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statement: StatementOfAccount;
  onDisputeSubmitted?: (lineItemId: string) => void;
}

const issueOptions: { value: LineItemIssue; label: string }[] = [
  { value: 'amount', label: 'Amount is incorrect' },
  { value: 'description', label: 'Description is incorrect' },
  { value: 'category', label: 'Category is incorrect' },
  { value: 'other', label: 'Other' },
];

export function StatementDisputeModal({ open, onOpenChange, statement, onDisputeSubmitted }: StatementDisputeModalProps) {
  const [lineItemId, setLineItemId] = useState('');
  const [issue, setIssue] = useState<LineItemIssue | ''>('');
  const [correctValue, setCorrectValue] = useState('');

  useEffect(() => {
    if (open) { setLineItemId(''); setIssue(''); setCorrectValue(''); }
  }, [open]);

  const handleSubmit = () => {
    if (!lineItemId || !issue) return;
    toast.success('Statement dispute raised successfully');
    onDisputeSubmitted?.(lineItemId);
    onOpenChange(false);
  };

  const isNumericIssue = issue === 'amount';

  return (
    <StandardModal
      open={open}
      onOpenChange={onOpenChange}
      title="Dispute Statement Line Item"
      size="md"
      footer={
        <Button className="w-full h-12 text-base" disabled={!lineItemId || !issue} onClick={handleSubmit}>
          Submit Dispute
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-[14px] font-semibold">Which line item?</Label>
          <select
            value={lineItemId}
            onChange={(e) => setLineItemId(e.target.value)}
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-[14px]"
          >
            <option value="">Select a line item...</option>
            {statement.lineItems.map(li => (
              <option key={li.id} value={li.id}>
                {li.description} ({li.type === 'credit' ? '+' : '-'}€{li.amount.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-[14px] font-semibold">What is wrong?</Label>
          <select
            value={issue}
            onChange={(e) => { setIssue(e.target.value as LineItemIssue); setCorrectValue(''); }}
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-[14px]"
          >
            <option value="">Select an issue...</option>
            {issueOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {issue && (
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold">
              {isNumericIssue ? 'Correct amount (€)' : 'Correct value'}
            </Label>
            {isNumericIssue ? (
              <Input
                type="number"
                placeholder="e.g. 2000"
                value={correctValue}
                onChange={(e) => setCorrectValue(e.target.value)}
              />
            ) : (
              <Input
                type="text"
                placeholder="Enter the correct value..."
                value={correctValue}
                onChange={(e) => setCorrectValue(e.target.value)}
              />
            )}
          </div>
        )}
      </div>
    </StandardModal>
  );
}
