import { useState } from "react";
import { Deal, DealStatus } from "@/data/types";
import { Input } from "./ui/input";
import { CheckCircle2, Circle, Upload, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MissingField {
  label: string;
  placeholder: string;
  type: "text" | "file";
}

export function getMissingFields(deal: Deal): { details: MissingField[]; documents: MissingField[] } {
  const details: MissingField[] = [];
  const documents: MissingField[] = [];

  if (!deal.externalPartners?.[0]?.partnerBank) {
    details.push({ label: "Bank Account (IBAN)", placeholder: "e.g. ES91 2100 0418 4502 0005 1332", type: "text" });
  }
  if (!deal.sellerName) {
    details.push({ label: "Beneficiary Name", placeholder: "Full legal name of the account holder", type: "text" });
  }
  if (!deal.sellerTaxId) {
    details.push({ label: "Tax ID (NIF/CIF)", placeholder: "e.g. 12345678A", type: "text" });
  }

  documents.push({ label: "Buyer's Passport", placeholder: "", type: "file" });
  documents.push({ label: "Buyer's EID", placeholder: "", type: "file" });
  documents.push({ label: "AML/KYC", placeholder: "", type: "file" });
  documents.push({ label: "Signed SPA", placeholder: "", type: "file" });

  return { details, documents };
}

interface PendingDetailsSectionProps {
  deal: Deal;
  onSave?: (updated: Deal) => void;
  /** "panel" for side panels, "page" for full-page layout */
  variant?: "panel" | "page";
}

export function PendingDetailsSection({ deal, onSave, variant = "panel" }: PendingDetailsSectionProps) {
  const missing = getMissingFields(deal);
  const [missingValues, setMissingValues] = useState<Record<string, string>>({});
  const [submittedDetails, setSubmittedDetails] = useState<Set<string>>(new Set());
  const [submittedDocs, setSubmittedDocs] = useState<Set<number>>(new Set());
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);

  const filledDetails = missing.details.filter((_, i) => submittedDetails.has(`detail-${i}`)).length;
  const filledDocs = missing.documents.filter((_, i) => submittedDocs.has(i)).length;

  const checkAndTransition = (newSubmittedDetails: Set<string>, newSubmittedDocs: Set<number>) => {
    const allDetailsDone = missing.details.every((_, i) => newSubmittedDetails.has(`detail-${i}`));
    const allDocsDone = missing.documents.every((_, i) => newSubmittedDocs.has(i));
    if (allDetailsDone && allDocsDone) {
      const updated: Deal = { ...deal, status: "under-review" as DealStatus };
      onSave?.(updated);
      toast.success("All information provided — deal moved to Under Review");
    }
  };

  const handleSubmitDetail = async (key: string) => {
    setSubmittingKey(key);
    await new Promise((r) => setTimeout(r, 600));
    const next = new Set(submittedDetails).add(key);
    setSubmittedDetails(next);
    setSubmittingKey(null);
    toast.success("Detail submitted successfully");
    checkAndTransition(next, submittedDocs);
  };

  const handleSubmitDoc = async (index: number) => {
    setSubmittingKey(`doc-${index}`);
    await new Promise((r) => setTimeout(r, 600));
    const next = new Set(submittedDocs).add(index);
    setSubmittedDocs(next);
    setSubmittingKey(null);
    toast.success("Document uploaded successfully");
    checkAndTransition(submittedDetails, next);
  };

  const isPage = variant === "page";

  return (
    <div className={isPage ? "" : "mt-6"}>
      {!isPage && <hr className="border-border mb-5" />}

      {/* Required Details */}
      {missing.details.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[hsl(var(--deal-pending-details))]" />
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Required Details</h3>
            </div>
            <span className="text-[12px] text-muted-foreground">{filledDetails} of {missing.details.length}</span>
          </div>
          <div className="space-y-4">
            {missing.details.map((field, i) => {
              const key = `detail-${i}`;
              const isSubmitted = submittedDetails.has(key);
              const isSubmitting = submittingKey === key;
              const hasValue = !!missingValues[key]?.trim();

              return (
                <div key={i}>
                  <label className="text-[13px] font-medium text-foreground mb-1.5 block">{field.label}</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={field.placeholder}
                      value={missingValues[key] || ""}
                      onChange={(e) => setMissingValues((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="bg-muted/40 border-border text-[13px] flex-1"
                      disabled={isSubmitted}
                    />
                    {isSubmitted ? (
                      <div className="flex items-center justify-center w-9 h-9 rounded-md bg-[hsl(var(--deal-paid))]/10">
                        <Check className="h-4 w-4 text-[hsl(var(--deal-paid))]" />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSubmitDetail(key)}
                        disabled={!hasValue || isSubmitting}
                        className="px-3 h-9 rounded-md bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Submit"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Required Documents */}
      {missing.documents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[hsl(var(--deal-pending-details))]" />
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Required Documents</h3>
            </div>
            <span className="text-[12px] text-muted-foreground">{filledDocs} of {missing.documents.length}</span>
          </div>
          <div className="space-y-3">
            {missing.documents.map((doc, i) => {
              const isSubmitted = submittedDocs.has(i);
              const isSubmitting = submittingKey === `doc-${i}`;

              return (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    {isSubmitted ? (
                      <CheckCircle2 className="h-4 w-4 text-[hsl(var(--deal-paid))]" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/30" />
                    )}
                    <span className={`text-[13px] font-medium ${isSubmitted ? "text-muted-foreground line-through" : "text-foreground"}`}>{doc.label}</span>
                  </div>
                  {isSubmitted ? (
                    <span className="text-[12px] text-[hsl(var(--deal-paid))] font-medium">Uploaded</span>
                  ) : (
                    <button
                      onClick={() => handleSubmitDoc(i)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-[12px] font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                    >
                      {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {isSubmitting ? "Uploading…" : "Upload"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Submit All Button (page variant) */}
      {isPage && (
        <button
          disabled={filledDetails + filledDocs < missing.details.length + missing.documents.length}
          className="w-full mt-6 py-3 rounded-md text-[14px] font-semibold transition-opacity bg-muted text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 hover:opacity-90"
        >
          Submit All Information
        </button>
      )}
    </div>
  );
}
