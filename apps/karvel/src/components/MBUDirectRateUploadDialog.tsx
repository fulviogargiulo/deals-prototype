import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertTriangle, X, Download } from "lucide-react";
import { sharedMBUDirectRates, type MBUDirectMonthlyRate } from "@huspy/shared-domain";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

const VALID_CHANNELS = ["REA", "DS", "B2C"] as const;
type DirectChannel = typeof VALID_CHANNELS[number];

const CSV_HEADERS = ["reportingMonth", "channel", "selfSourcedRate", "externalSourcedRate"];

const TEMPLATE_ROWS = [
  ["2026-06", "REA", "25", "20"],
  ["2026-06", "DS",  "30", "25"],
  ["2026-06", "B2C", "28", "23"],
];

function downloadTemplate(): void {
  const csv = [CSV_HEADERS.join(","), ...TEMPLATE_ROWS.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mbu-direct-rates-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj;
  });
}

function buildRates(rows: Record<string, string>[]): MBUDirectMonthlyRate[] {
  return rows.map((row) => ({
    id: `mdr-${row.channel.toLowerCase()}-${row.reportingMonth}`,
    reportingMonth: row.reportingMonth.trim(),
    channel: row.channel.trim() as DirectChannel,
    selfSourcedRate: parseFloat(row.selfSourcedRate),
    externalSourcedRate: parseFloat(row.externalSourcedRate),
  }));
}

function validate(rows: Record<string, string>[]): string[] {
  const errs: string[] = [];
  if (rows.length === 0) { errs.push("No data rows found"); return errs; }
  const monthRegex = /^\d{4}-\d{2}$/;
  for (const [i, row] of rows.entries()) {
    const n = i + 2;
    if (!row.reportingMonth) { errs.push(`Row ${n}: missing reportingMonth`); continue; }
    if (!monthRegex.test(row.reportingMonth.trim())) errs.push(`Row ${n}: reportingMonth must be YYYY-MM`);
    if (!VALID_CHANNELS.includes(row.channel?.trim() as DirectChannel)) errs.push(`Row ${n}: channel must be REA, DS, or B2C`);
    if (!row.selfSourcedRate || isNaN(parseFloat(row.selfSourcedRate))) errs.push(`Row ${n}: missing or invalid selfSourcedRate`);
    if (!row.externalSourcedRate || isNaN(parseFloat(row.externalSourcedRate))) errs.push(`Row ${n}: missing or invalid externalSourcedRate`);
  }
  return errs;
}

export function MBUDirectRateUploadDialog({ open, onClose, onImported }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [preview, setPreview] = useState<MBUDirectMonthlyRate[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "success">("upload");
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setRows([]);
    setPreview([]);
    setErrors([]);
    setStep("upload");
    setImportedCount(0);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = (f: File) => {
    setFile(f);
    setErrors([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target?.result as string);
      const errs = validate(parsed);
      if (errs.length > 0) { setErrors(errs); return; }
      setRows(parsed);
      setPreview(buildRates(parsed));
      setStep("preview");
    };
    reader.readAsText(f);
  };

  const handleImport = () => {
    for (const rate of preview) {
      const idx = sharedMBUDirectRates.findIndex(
        (r) => r.reportingMonth === rate.reportingMonth && r.channel === rate.channel
      );
      if (idx >= 0) sharedMBUDirectRates.splice(idx, 1, rate);
      else sharedMBUDirectRates.push(rate);
    }
    setImportedCount(preview.length);
    setStep("success");
    toast({ title: "MBU Direct Rates Imported", description: `Imported ${preview.length} rate(s)` });
    onImported();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload MBU Direct Rates
          </DialogTitle>
          <DialogDescription>One CSV row per channel × month. Uploading an existing channel+month replaces it.</DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-[14px] font-medium text-foreground">Drop your CSV here or click to browse</p>
              <p className="text-[12px] text-muted-foreground mt-1">.csv only</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

            {errors.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div className="text-[13px] text-destructive space-y-0.5">{errors.map((e, i) => <p key={i}>{e}</p>)}</div>
              </div>
            )}

            <div className="bg-accent/50 rounded-md p-4 space-y-2 text-[11px]">
              <p className="font-medium text-foreground text-[12px]">Format — one row per channel × month</p>
              <p className="font-mono text-muted-foreground">
                <span className="text-foreground">reportingMonth</span>,{" "}
                <span className="text-foreground">channel</span>,{" "}
                <span className="text-foreground">selfSourcedRate</span>,{" "}
                <span className="text-foreground">externalSourcedRate</span>
              </p>
              <div className="space-y-0.5 text-muted-foreground">
                <p><span className="text-foreground">reportingMonth</span> — YYYY-MM (e.g. 2026-06)</p>
                <p><span className="text-foreground">channel</span> — REA, DS, or B2C</p>
                <p><span className="text-foreground">selfSourcedRate</span> — % of bank commission paid to agent when no referral party (e.g. 25)</p>
                <p><span className="text-foreground">externalSourcedRate</span> — % of bank commission paid to agent when a referral party is present (e.g. 20)</p>
              </div>
              <p className="text-muted-foreground/70 italic pt-1">The referral party always receives 0.3% of bank commission unless overridden on the deal.</p>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[13px]">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{file?.name}</span>
              <span className="text-muted-foreground">— {preview.length} row(s)</span>
              <button onClick={reset} className="ml-auto text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="border border-border rounded-md overflow-auto max-h-[340px]">
              <table className="w-full text-[12px]">
                <thead className="bg-accent/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-foreground">Month</th>
                    <th className="px-4 py-2 text-left font-semibold text-foreground">Channel</th>
                    <th className="px-4 py-2 text-right font-semibold text-foreground">Self-sourced rate</th>
                    <th className="px-4 py-2 text-right font-semibold text-foreground">External rate</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.map((r) => {
                    const exists = sharedMBUDirectRates.some(
                      (x) => x.reportingMonth === r.reportingMonth && x.channel === r.channel
                    );
                    return (
                      <tr key={r.id}>
                        <td className="px-4 py-2 font-mono text-foreground">{r.reportingMonth}</td>
                        <td className="px-4 py-2 text-foreground">{r.channel}</td>
                        <td className="px-4 py-2 text-right font-mono text-foreground">{r.selfSourcedRate}%</td>
                        <td className="px-4 py-2 text-right font-mono text-foreground">{r.externalSourcedRate}%</td>
                        <td className="px-4 py-2 text-right">
                          {exists && (
                            <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">will replace</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-[16px] font-semibold text-foreground">Rates Imported</p>
            <p className="text-[13px] text-muted-foreground mt-1">{importedCount} rate(s) updated</p>
          </div>
        )}

        <DialogFooter className="flex-row items-center">
          <Button variant="outline" size="sm" className="mr-auto gap-1.5" onClick={downloadTemplate}>
            <Download className="h-3.5 w-3.5" />
            Download Template
          </Button>
          {step === "upload" && <Button variant="outline" onClick={handleClose}>Cancel</Button>}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={handleImport}>Import {preview.length} Rate(s)</Button>
            </>
          )}
          {step === "success" && <Button onClick={handleClose}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
