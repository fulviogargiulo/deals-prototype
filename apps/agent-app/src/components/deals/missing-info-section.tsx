import { useState } from 'react';
import { Deal } from '@/types';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { DocumentRow } from './document-row';

interface DocumentItem {
  name: string;
  uploaded: boolean;
}

interface MissingInfoSectionProps {
  deal: Deal;
  documents: DocumentItem[];
  uploadedDocs: Set<number>;
  onUploadDoc: (index: number, fileName: string) => void;
  onInfoSubmitted?: () => void;
  onAddComment?: (text: string) => void;
}

export function MissingInfoSection({ deal, documents, uploadedDocs, onUploadDoc, onInfoSubmitted, onAddComment }: MissingInfoSectionProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitNote, setSubmitNote] = useState('');

  if (deal.status !== 'pending-details') return null;

  const pendingDocs = documents.map((doc, i) => ({ doc, index: i })).filter(({ doc, index }) => !doc.uploaded && !uploadedDocs.has(index));
  const uploadedDocCount = documents.length - pendingDocs.length;
  const allDocsUploaded = pendingDocs.length === 0;

  const canSubmit = !!submitNote.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAddComment?.(submitNote.trim());
    setSubmitted(true);
    toast.success('Information submitted — deal moved to Under Review');
    onInfoSubmitted?.();
  };

  if (submitted) {
    return (
      <div className="bg-card rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(var(--ds-green)/0.1)]">
            <CheckCircle2 className="w-4 h-4 text-[hsl(var(--ds-green))]" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-foreground leading-[120%]">Information Submitted</p>
            <p className="text-[12px] text-[hsl(var(--fg-secondary))] leading-[140%] mt-0.5">
              We're now reviewing your deal details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sortedDocs = [...documents]
    .map((doc, i) => ({ doc, originalIndex: i }))
    .sort((a, b) => {
      const aUp = a.doc.uploaded || uploadedDocs.has(a.originalIndex);
      const bUp = b.doc.uploaded || uploadedDocs.has(b.originalIndex);
      if (aUp === bUp) return 0;
      return aUp ? 1 : -1;
    });

  return (
    <Collapsible>
      <div className="bg-card rounded-2xl overflow-hidden">
        <CollapsibleTrigger className="w-full px-5 py-4 flex items-center gap-3 hover:bg-[hsl(var(--surface-raised))] transition-colors">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[hsl(var(--ds-orange)/0.1)]">
            <AlertTriangle className="w-4 h-4 text-[hsl(var(--ds-orange))]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[14px] font-semibold text-foreground leading-[120%]">
              Action Required — Upload Documents & Submit
            </p>
            <p className="text-[12px] text-[hsl(var(--fg-secondary))] leading-[140%] mt-0.5">
              Upload any available documents and add a note for Ops to proceed.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {allDocsUploaded ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[hsl(var(--ds-green)/0.1)] text-[hsl(var(--ds-green))]">
                <CheckCircle2 className="w-3 h-3" />
                All docs uploaded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[hsl(var(--ds-orange)/0.1)] text-[hsl(var(--ds-orange))]">
                {pendingDocs.length} doc{pendingDocs.length !== 1 ? 's' : ''} pending
              </span>
            )}
            <ChevronDown className="w-4 h-4 text-[hsl(var(--fg-secondary))] transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-[hsl(var(--border-ds-primary))] px-5 py-5 space-y-6">
            {/* Documents */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                <h4 className="text-[12px] font-semibold text-[hsl(var(--fg-secondary))] leading-[140%] uppercase tracking-wide">
                  Documents
                </h4>
                <span className="text-[10px] font-semibold text-[hsl(var(--fg-secondary))] ml-auto">
                  {uploadedDocCount} of {documents.length}
                </span>
              </div>

              {sortedDocs.map(({ doc, originalIndex }) => {
                const isUploaded = doc.uploaded || uploadedDocs.has(originalIndex);
                return (
                  <DocumentRow
                    key={originalIndex}
                    name={doc.name}
                    isUploaded={isUploaded}
                    uploadedFileName={isUploaded ? `${doc.name}.pdf` : undefined}
                    onUpload={() => onUploadDoc(originalIndex, doc.name)}
                    onDownload={() => {}}
                    onReplace={() => onUploadDoc(originalIndex, doc.name)}
                    onDelete={() => {}}
                  />
                );
              })}
            </div>

            {/* Note for Ops */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold leading-[140%] text-[hsl(var(--fg-secondary))]">
                Add a note for Huspy <span style={{ color: 'hsl(var(--ds-orange))' }}>*</span>
              </label>
              <textarea
                value={submitNote}
                onChange={(e) => setSubmitNote(e.target.value)}
                placeholder="Describe what you've completed or any context Huspy Ops should know..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border-ds-primary))] bg-transparent text-[13px] leading-[140%] text-foreground placeholder:text-[hsl(var(--fg-secondary))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--fg-primary))]"
              />
            </div>

            {/* Submit */}
            <Button
              className="w-full h-10 rounded-xl text-[14px] font-semibold"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              Submit for Review
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
