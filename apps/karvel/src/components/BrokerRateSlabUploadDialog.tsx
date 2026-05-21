import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertTriangle, X, Download } from "lucide-react";
import { sharedBrokerRateSlabs, sharedParties, type BrokerRateSlab } from "@huspy/shared-domain";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

// One row per (tier × bank). tierUpTo is blank for the unlimited top tier.
const CSV_HEADERS = ["reportingMonth", "tierUpTo", "bankId", "pct"];

// Template: 2026-06, same bank set as current months, two tiers.
const TEMPLATE_ROWS = [
  ["2026-06", "5000000", "party-third-dib",     "0.624"],
  ["2026-06", "5000000", "party-third-adib",    "0.663"],
  ["2026-06", "5000000", "party-third-mashreq", "0.580"],
  ["2026-06", "5000000", "party-third-fab",     "0.550"],
  ["2026-06", "",        "party-third-dib",     "0.720"],
  ["2026-06", "",        "party-third-adib",    "0.760"],
  ["2026-06", "",        "party-third-mashreq", "0.680"],
  ["2026-06", "",        "party-third-fab",     "0.650"],
];

function downloadTemplate(): void {
  const csv = [CSV_HEADERS.join(","), ...TEMPLATE_ROWS.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "broker-rate-slabs-template.csv";
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

function buildSlabs(rows: Record<string, string>[]): BrokerRateSlab[] {
  // Group by reportingMonth.
  const byMonth = new Map<string, Record<string, string>[]>();
  for (const row of rows) {
    const m = row.reportingMonth?.trim();
    if (!m) continue;
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m)!.push(row);
  }

  const configs: BrokerRateSlab[] = [];
  for (const [month, monthRows] of byMonth) {
    // Group by tierUpTo — preserve insertion order (assumes CSV is sorted ascending).
    const tierMap = new Map<string, { bankId: string; pct: number }[]>();
    for (const row of monthRows) {
      const key = row.tierUpTo?.trim() ?? "";
      if (!tierMap.has(key)) tierMap.set(key, []);
      tierMap.get(key)!.push({ bankId: row.bankId.trim(), pct: parseFloat(row.pct) });
    }

    const slabs = Array.from(tierMap.entries()).map(([upToStr, bankRates]) => ({
      upTo: upToStr === "" ? null : parseFloat(upToStr),
      bankRates,
    }));

    configs.push({ id: `brs-${month}`, reportingMonth: month, slabs });
  }
  return configs;
}

function validate(rows: Record<string, string>[]): string[] {
  const errs: string[] = [];
  if (rows.length === 0) { errs.push("No data rows found"); return errs; }
  const monthRegex = /^\d{4}-\d{2}$/;
  for (const [i, row] of rows.entries()) {
    const n = i + 2;
    if (!row.reportingMonth) { errs.push(`Row ${n}: missing reportingMonth`); continue; }
    if (!monthRegex.test(row.reportingMonth.trim())) errs.push(`Row ${n}: reportingMonth must be YYYY-MM`);
    if (!row.bankId) errs.push(`Row ${n}: missing bankId`);
    if (!row.pct || isNaN(parseFloat(row.pct))) errs.push(`Row ${n}: missing or invalid pct`);
    if (row.tierUpTo && isNaN(parseFloat(row.tierUpTo))) errs.push(`Row ${n}: tierUpTo must be a number or blank`);
  }
  // Each month must have exactly one blank-tierUpTo (unlimited) tier.
  const byMonth = new Map<string, Record<string, string>[]>();
  for (const row of rows) {
    const m = row.reportingMonth?.trim();
    if (!m) continue;
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m)!.push(row);
  }
  for (const [month, monthRows] of byMonth) {
    const unlimitedRows = monthRows.filter((r) => !r.tierUpTo?.trim());
    if (unlimitedRows.length === 0) errs.push(`Month ${month}: must have at least one row with blank tierUpTo (unlimited tier)`);
  }
  return errs;
}

function bankName(bankId: string): string {
  return sharedParties.find((p) => p.id === bankId)?.displayName ?? bankId;
}

export function BrokerRateSlabUploadDialog({ open, onClose, onImported }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [preview, setPreview] = useState<BrokerRateSlab[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "success">("upload");
  const [importedMonths, setImportedMonths] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setRows([]);
    setPreview([]);
    setErrors([]);
    setStep("upload");
    setImportedMonths([]);
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
      setPreview(buildSlabs(parsed));
      setStep("preview");
    };
    reader.readAsText(f);
  };

  const handleImport = () => {
    const months = preview.map((c) => c.reportingMonth);
    // Replace existing configs for the same month; append new ones.
    for (const config of preview) {
      const idx = sharedBrokerRateSlabs.findIndex((s) => s.reportingMonth === config.reportingMonth);
      if (idx >= 0) sharedBrokerRateSlabs.splice(idx, 1, config);
      else sharedBrokerRateSlabs.push(config);
    }
    setImportedMonths(months);
    setStep("success");
    toast({ title: "Rate Slabs Imported", description: `Imported ${months.length} month(s): ${months.join(", ")}` });
    onImported();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Broker Rate Slabs
          </DialogTitle>
          <DialogDescription>One CSV row per tier × bank combination. Each unique reportingMonth creates or replaces one monthly config.</DialogDescription>
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
              <p className="font-medium text-foreground text-[12px]">Format — one row per tier × bank</p>
              <p className="font-mono text-muted-foreground">
                <span className="text-foreground">reportingMonth</span>,{" "}
                <span className="text-foreground">tierUpTo</span>,{" "}
                <span className="text-foreground">bankId</span>,{" "}
                <span className="text-foreground">pct</span>
              </p>
              <div className="space-y-0.5 text-muted-foreground">
                <p><span className="text-foreground">reportingMonth</span> — YYYY-MM format (e.g. 2026-06)</p>
                <p><span className="text-foreground">tierUpTo</span> — AED GMV ceiling for the tier; leave blank for the unlimited (top) tier</p>
                <p><span className="text-foreground">bankId</span> — party ID of the bank (e.g. party-third-dib)</p>
                <p><span className="text-foreground">pct</span> — rate as % of disbursed mortgage amount (e.g. 0.624)</p>
              </div>
              <p className="text-muted-foreground/70 italic pt-1">Uploading a month that already exists will replace it entirely.</p>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[13px]">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{file?.name}</span>
              <span className="text-muted-foreground">— {preview.length} month(s), {rows.length} rows</span>
              <button onClick={reset} className="ml-auto text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="border border-border rounded-md overflow-auto max-h-[340px]">
              {preview.map((config) => (
                <div key={config.reportingMonth}>
                  <div className="px-4 py-2 bg-accent/50 text-[12px] font-semibold text-foreground border-b border-border">
                    {config.reportingMonth}
                    {sharedBrokerRateSlabs.some((s) => s.reportingMonth === config.reportingMonth) && (
                      <span className="ml-2 text-[10px] font-normal text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">will replace existing</span>
                    )}
                  </div>
                  {config.slabs.map((slab, i) => (
                    <div key={i} className="px-4 py-2 border-b border-border last:border-0">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        {slab.upTo == null
                          ? `Tier ${i + 1} — unlimited`
                          : `Tier ${i + 1} — up to AED ${slab.upTo.toLocaleString()}`}
                      </p>
                      <table className="w-full text-[12px]">
                        <tbody>
                          {slab.bankRates.map((r) => (
                            <tr key={r.bankId}>
                              <td className="py-0.5 text-foreground">{bankName(r.bankId)}</td>
                              <td className="py-0.5 text-right font-mono text-foreground">{r.pct.toFixed(3)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-[16px] font-semibold text-foreground">Rate Slabs Imported</p>
            <p className="text-[13px] text-muted-foreground mt-1">{importedMonths.join(", ")}</p>
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
              <Button onClick={handleImport}>Import {preview.length} Month(s)</Button>
            </>
          )}
          {step === "success" && <Button onClick={handleClose}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
