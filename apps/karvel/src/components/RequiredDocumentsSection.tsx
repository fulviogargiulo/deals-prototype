import { CheckCircle2, Circle, Upload, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const REQUIRED_DOCS = [
  "Buyer's Passport",
  "Buyer's EID",
  "AML/KYC",
  "Signed SPA",
];

interface Props {
  uploadedDocs: Set<number>;
  onUpload: (index: number) => void;
  /** "panel" for side panels, "page" for full-page layout */
  variant?: "panel" | "page";
}

export function RequiredDocumentsSection({ uploadedDocs, onUpload, variant = "panel" }: Props) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const handleUpload = async (index: number) => {
    setUploadingIdx(index);
    await new Promise((r) => setTimeout(r, 600));
    onUpload(index);
    setUploadingIdx(null);
    toast.success("Document uploaded successfully");
  };

  const filledCount = REQUIRED_DOCS.filter((_, i) => uploadedDocs.has(i)).length;
  const isPage = variant === "page";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-destructive" />
          <h3 className={`font-bold text-muted-foreground uppercase tracking-wider ${isPage ? "text-xs" : "text-[11px]"}`}>
            Required Documents
          </h3>
        </div>
        <span className="text-[12px] text-muted-foreground">
          {filledCount} of {REQUIRED_DOCS.length}
        </span>
      </div>
      <div className="space-y-3">
        {REQUIRED_DOCS.map((doc, i) => {
          const isUploaded = uploadedDocs.has(i);
          const isUploading = uploadingIdx === i;

          return (
            <div
              key={i}
              className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-3">
                {isUploaded ? (
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--deal-paid))]" />
                ) : (
                  <Circle className="h-4 w-4 text-destructive/40" />
                )}
                <span
                  className={`text-[13px] font-medium ${
                    isUploaded
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }`}
                >
                  {doc}
                </span>
              </div>
              {isUploaded ? (
                <span className="text-[12px] text-[hsl(var(--deal-paid))] font-medium">
                  Uploaded
                </span>
              ) : (
                <button
                  onClick={() => handleUpload(i)}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-[12px] font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                >
                  {isUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {isUploading ? "Uploading…" : "Upload"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
