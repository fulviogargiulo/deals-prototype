import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertTriangle, X } from "lucide-react";
import { Deal, AgentEntry, PayableEntry, ReceivableEntry, ExternalPartnerEntry } from "@/data/types";
import { toast } from "@/hooks/use-toast";
import { recalculateDeal } from "@/lib/dealCalculations";

interface Props {
  open: boolean;
  onClose: () => void;
  onDealsCreated: (deals: Deal[]) => void;
}

const REQUIRED_HEADERS = ["offerId", "market", "businessUnit", "country", "propertyName", "clientName", "agentName", "dealPrice"];

function makeDefaultAgent(): AgentEntry {
  return {
    agentName: "", agentShare: 0, agentCommissionRate: 0, agentCommissionPayout: 0,
    agentIncentive: 0, agentDeductions: 0, agentTotalAmount: 0,
    teamLeadRate: 0, teamLeadShare: 0, managerOverrideRate: 0, managerOverride: 0,
    referralPercentage: 0, referralAmount: 0, clientKickback: 0,
  };
}

function csvToDeal(row: Record<string, string>, index: number): Deal {
  const id = `DEAL-${String(Date.now()).slice(-6)}-${String(index + 1).padStart(3, "0")}`;
  const dealPrice = parseFloat(row.dealPrice) || 0;
  const takeRate = parseFloat(row.takeRate) || 3;
  const huspyRevenue = dealPrice * (takeRate / 100);
  const conveyanceFee = parseFloat(row.conveyanceFee) || 0;

  return {
    id,

    status: "under-review",
    market: (row.market as Deal["market"]) || "primary",
    businessUnit: (row.businessUnit as Deal["businessUnit"]) || "rebu",
    country: (row.country as Deal["country"]) || "ae",
    clientName: row.clientName || "Unknown Client",
    agentName: row.agentName || "Unknown Agent",
    title: row.propertyName || row.buildingName || "",
    dealAmount: dealPrice,
    reportDate: new Date().toISOString().split("T")[0],
    dealPrice,
    takeRate,
    huspyRevenue,
    conveyanceRevenue: conveyanceFee,
    agentShare: parseFloat(row.agentShare || "50"),
    agentCommissionRate: parseFloat(row.agentCommissionRate) || 0,
    agentCommissionPayout: 0,
    teamLeadRate: 0, teamLeadShare: 0,
    managerOverrideRate: 0, managerOverride: 0,
    conveyanceAgentRate: 0, conveyanceAgentPayout: 0, huspyConveyanceShare: 0,
    clientKickback: 0, referralPercentage: 0, referralAmount: 0,
    rebatePercentage: 0, rebateAmount: 0, subsidyAmount: 0,
    cogsInternal: 0, cogsExternal: 0, cogsReferrals: 0, cogsRebates: 0, cogsSubsidy: 0,
    numberOfTranches: 0, disbursedAmount: 0, bankSlab: 0,
    brokerCommissionRate: 0, brokerPayout: 0,
    rmCommissionRate: 0, rmPayout: 0, tlCommissionRate: 0, tlPayout: 0,
    dsCommissionRate: 0, dsPayout: 0, externalCommissionRate: 0, externalPayout: 0,
    externalPartnerShare: 0,
    agents: [{ ...makeDefaultAgent(), agentName: row.agentName || "Unknown Agent", agentShare: 50, agentCommissionRate: 40 }],
    externalPartners: [] as ExternalPartnerEntry[],
    receivables: [] as ReceivableEntry[],
    payables: [] as PayableEntry[],
    buildingName: row.buildingName || "",
    community: row.community || "",
    buyerName: row.buyerName || "",
    sellerName: row.sellerName || "",
  };
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return obj;
  });
  return { headers, rows };
}

export function BulkUploadDialog({ open, onClose, onDealsCreated }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "success">("upload");
  const [createdCount, setCreatedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setErrors([]);
    setStep("upload");
    setCreatedCount(0);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (f: File) => {
    setFile(f);
    setErrors([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.rows.length === 0) {
        setErrors(["CSV file has no data rows"]);
        return;
      }
      setPreview(parsed);
      setStep("preview");
    };
    reader.readAsText(f);
  };

  const handleCreate = () => {
    if (!preview) return;
    const deals = preview.rows.map((row, i) => recalculateDeal(csvToDeal(row, i)));
    onDealsCreated(deals);
    setCreatedCount(deals.length);
    setStep("success");
    toast({ title: "Deals Created", description: `${deals.length} deals have been created successfully.` });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Upload Deals
          </DialogTitle>
          <DialogDescription>Upload a CSV file to create multiple deals at once.</DialogDescription>
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
              <p className="text-[14px] font-medium text-foreground">Drop your CSV file here or click to browse</p>
              <p className="text-[12px] text-muted-foreground mt-1">Supports .csv files only</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

            {errors.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div className="text-[13px] text-destructive">{errors.map((e, i) => <p key={i}>{e}</p>)}</div>
              </div>
            )}

            <div className="bg-accent/50 rounded-md p-4">
              <p className="text-[12px] font-medium text-foreground mb-2">Required CSV columns:</p>
              <p className="text-[11px] text-muted-foreground font-mono">
                <span className="text-foreground font-semibold">offerId</span>, {REQUIRED_HEADERS.filter(h => h !== "offerId").join(", ")}
              </p>
              <p className="text-[11px] text-destructive/80 mt-1.5">* offerId is mandatory for each row</p>
              <p className="text-[11px] text-muted-foreground mt-1">Optional: takeRate, buyerName, sellerName, buildingName, community, agentShare, agentCommissionRate</p>
            </div>
          </div>
        )}

        {step === "preview" && preview && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[13px]">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{file?.name}</span>
              <span className="text-muted-foreground">— {preview.rows.length} deal(s) found</span>
              <button onClick={reset} className="ml-auto text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="border border-border rounded-md overflow-auto max-h-[300px]">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-accent/50">
                    {preview.headers.slice(0, 7).map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {preview.headers.slice(0, 7).map(h => (
                        <td key={h} className="px-3 py-2 text-foreground whitespace-nowrap">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.rows.length > 10 && (
                <p className="text-[11px] text-muted-foreground text-center py-2">...and {preview.rows.length - 10} more rows</p>
              )}
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-[hsl(var(--deal-paid))] mb-4" />
            <p className="text-[16px] font-semibold text-foreground">{createdCount} Deals Created Successfully</p>
            <p className="text-[13px] text-muted-foreground mt-1">All deals have been added with status "under-review"</p>
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={handleCreate}>Create {preview?.rows.length} Deal(s)</Button>
            </>
          )}
          {step === "success" && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
