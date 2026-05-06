import { useState, useEffect } from 'react';
import { Deal, DisputeField } from '@/types';
import { StandardModal } from '@/components/ui/standard-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface DealDisputeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal | null;
  onDisputeSubmitted?: (dealId: string) => void;
}

const fieldOptions: { value: DisputeField; label: string }[] = [
  { value: 'deal-amount', label: 'Deal amount' },
  { value: 'commission-percentage', label: 'Commission percentage' },
  { value: 'report-date', label: 'Deal report date' },
  { value: 'other', label: 'Other' },
];

export function DealDisputeModal({ open, onOpenChange, deal, onDisputeSubmitted }: DealDisputeModalProps) {
  const [field, setField] = useState<DisputeField | ''>('');
  const [correctValue, setCorrectValue] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) { setField(''); setCorrectValue(''); setDescription(''); }
  }, [open]);

  const handleSubmit = () => {
    if (!field || !deal) return;
    toast.success('Dispute raised successfully');
    onDisputeSubmitted?.(deal.id);
    onOpenChange(false);
  };

  return (
    <StandardModal
      open={open}
      onOpenChange={onOpenChange}
      title="Raise a Dispute"
      description={deal ? `Dispute for: ${deal.title}` : undefined}
      size="md"
      footer={
        <Button className="w-full h-12 text-base" disabled={!field} onClick={handleSubmit}>
          Submit Dispute
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-[14px] font-semibold">What is wrong?</Label>
          <select
            value={field}
            onChange={(e) => { setField(e.target.value as DisputeField); setCorrectValue(''); }}
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-[14px]"
          >
            <option value="">Select an issue...</option>
            {fieldOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {field === 'deal-amount' && (
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold">Correct amount (€)</Label>
            <Input
              type="number"
              placeholder="e.g. 400000"
              value={correctValue}
              onChange={(e) => setCorrectValue(e.target.value)}
            />
          </div>
        )}

        {field === 'commission-percentage' && (
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold">Correct commission (%)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="e.g. 3.5"
              value={correctValue}
              onChange={(e) => setCorrectValue(e.target.value)}
            />
          </div>
        )}

        {field === 'report-date' && (
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold">Correct report date</Label>
            <Input
              type="date"
              value={correctValue}
              onChange={(e) => setCorrectValue(e.target.value)}
            />
          </div>
        )}

        {field === 'other' && (
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold">Describe the issue</Label>
            <Textarea
              placeholder="Please describe what is wrong..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        )}
      </div>
    </StandardModal>
  );
}
