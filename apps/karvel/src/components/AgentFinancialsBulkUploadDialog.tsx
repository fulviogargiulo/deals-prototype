import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertTriangle, X, Download } from "lucide-react";
import { sharedAgentFinancials, sharedAgents, sharedParties } from "@huspy/shared-domain";
import type { AgentFinancials, ConnectedAgent, AgentStrategy, PnlEngine } from "@huspy/shared-domain";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ParsedRow {
  agentId: string;
  agentName: string;
  financials: AgentFinancials;
  warnings: string[];
}

function resolveAgentName(agentId: string): string {
  const agent = sharedAgents.find((a) => a.id === agentId);
  if (!agent) return agentId;
  const party = sharedParties.find((p) => p.id === agent.partyId);
  return party?.displayName ?? agentId;
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
    return obj;
  });
  return { headers, rows };
}

function parseStrategy(row: Record<string, string>): AgentStrategy {
  const kind = row.strategyKind?.trim();
  if (kind === "broker-rate-slab") return { kind: "broker-rate-slab" };
  if (kind === "mbu-direct-rate-slab") return { kind: "mbu-direct-rate-slab" };
  if (kind === "slab") {
    const slabs: { upTo: number | null; pct: number }[] = [];
    for (let i = 1; i <= 5; i++) {
      const pctRaw = row[`slab${i}_pct`]?.trim();
      if (!pctRaw) break;
      const upToRaw = row[`slab${i}_upTo`]?.trim();
      slabs.push({
        upTo: !upToRaw || upToRaw === "null" || upToRaw === "" ? null : parseFloat(upToRaw),
        pct: parseFloat(pctRaw) || 0,
      });
    }
    return { kind: "slab", slabs };
  }
  if (kind === "max") {
    return {
      kind: "max",
      pct: parseFloat(row.strategyPct) || 0,
      capAmount: parseFloat(row.capAmount) || 0,
    };
  }
  return { kind: "flat", pct: parseFloat(row.strategyPct) || 0 };
}

const VALID_ENGINES: PnlEngine[] = ["rebu", "mbu-ma-broker", "mbu-direct", "manual"];

function parseRow(row: Record<string, string>, rowIndex: number): ParsedRow | null {
  const agentId = row.agentId?.trim();
  if (!agentId) return null;

  const warnings: string[] = [];
  const agent = sharedAgents.find((a) => a.id === agentId);
  if (!agent) warnings.push(`Agent "${agentId}" not found — will create new financials record`);

  const pnlEngine = row.pnlEngine?.trim() as PnlEngine;
  if (!VALID_ENGINES.includes(pnlEngine)) {
    warnings.push(`pnlEngine "${pnlEngine}" is not valid — must be one of: ${VALID_ENGINES.join(", ")}`);
    return null;
  }

  const strategy = parseStrategy(row);

  const connectedAgents: ConnectedAgent[] = [];
  for (let i = 1; i <= 10; i++) {
    const caAgentId = row[`ca${i}_agentId`]?.trim();
    if (!caAgentId) break;
    const caAgent = sharedAgents.find((a) => a.id === caAgentId);
    if (!caAgent) warnings.push(`ca${i}: agent "${caAgentId}" not found`);
    connectedAgents.push({
      id: `ca-bulk-${agentId}-${i}-${rowIndex}`,
      agentId: caAgentId,
      label: row[`ca${i}_label`]?.trim() || "Team Lead",
      rate: parseFloat(row[`ca${i}_rate`]) || 0,
    });
  }

  const existing = sharedAgentFinancials.find((af) => af.agentId === agentId && af.pnlEngine === pnlEngine);
  const financials: AgentFinancials = {
    id: existing?.id ?? `af-bulk-${agentId}-${pnlEngine}`,
    agentId,
    pnlEngine,
    strategy,
    connectedAgents,
  };

  return { agentId, agentName: resolveAgentName(agentId), financials, warnings };
}

function strategyLabel(s: AgentStrategy): string {
  if (s.kind === "flat") return `Flat ${s.pct}%`;
  if (s.kind === "max") return `Max ${s.pct}% (cap ${s.capAmount})`;
  if (s.kind === "broker-rate-slab") return "Broker rate slab (resolved at calc time)";
  if (s.kind === "mbu-direct-rate-slab") return "MBU direct rate slab (resolved at calc time)";
  return `Slab (${s.slabs.length} tiers)`;
}

const TEMPLATE_CSV = `agentId,pnlEngine,strategyKind,strategyPct,capAmount,slab1_upTo,slab1_pct,slab2_upTo,slab2_pct,slab3_upTo,slab3_pct,ca1_agentId,ca1_label,ca1_rate,ca2_agentId,ca2_label,ca2_rate
agent-001,rebu,flat,40,,,,,,,,agent-008,Team Lead,10,agent-009,Manager,5
agent-005,rebu,slab,,,5000,35,20000,45,null,55,agent-010,Team Lead,10,agent-011,Manager,5
agent-006,rebu,max,50,25000,,,,,,,agent-010,Team Lead,10,agent-011,Manager,5
broker-001,mbu-ma-broker,broker-rate-slab,,,,,,,,,,,,,`;

export function AgentFinancialsBulkUploadDialog({ open, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "success">("upload");
  const [updatedCount, setUpdatedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setParsed([]);
    setErrors([]);
    setStep("upload");
    setUpdatedCount(0);
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
      const { rows } = parseCSV(text);
      if (rows.length === 0) {
        setErrors(["CSV has no data rows"]);
        return;
      }
      const results: ParsedRow[] = [];
      const errs: string[] = [];
      rows.forEach((row, i) => {
        const result = parseRow(row, i);
        if (!result) {
          errs.push(`Row ${i + 2}: missing agentId`);
        } else {
          results.push(result);
        }
      });
      if (results.length === 0) {
        setErrors(errs.length > 0 ? errs : ["No valid rows found"]);
        return;
      }
      setParsed(results);
      setErrors(errs);
      setStep("preview");
    };
    reader.readAsText(f);
  };

  const handleApply = () => {
    parsed.forEach(({ financials }) => {
      const idx = sharedAgentFinancials.findIndex(
        (af) => af.agentId === financials.agentId && af.pnlEngine === financials.pnlEngine
      );
      if (idx >= 0) sharedAgentFinancials[idx] = financials;
      else sharedAgentFinancials.push(financials);
    });
    setUpdatedCount(parsed.length);
    setStep("success");
    toast({ title: "Financials updated", description: `${parsed.length} agent(s) updated.` });
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agent_financials_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Update Agent Financials
          </DialogTitle>
          <DialogDescription>
            Upload a CSV to update commission strategy and connected agents for multiple agents at once.
          </DialogDescription>
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

            <div className="bg-accent/50 rounded-md p-4 space-y-2">
              <p className="text-[12px] font-medium text-foreground">Required column: <span className="font-mono">agentId</span></p>
              <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">
                strategyKind (flat|slab|max), strategyPct, capAmount<br />
                slab1_upTo, slab1_pct, slab2_upTo, slab2_pct, … (slab only)<br />
                ca1_agentId, ca1_label, ca1_rate, ca2_agentId, ca2_label, ca2_rate, …
              </p>
              <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-[12px] text-primary hover:underline mt-1">
                <Download className="h-3.5 w-3.5" />
                Download template CSV
              </button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[13px]">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{file?.name}</span>
              <span className="text-muted-foreground">— {parsed.length} agent(s)</span>
              <button onClick={reset} className="ml-auto text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {errors.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[12px] text-amber-700">{errors.map((e, i) => <p key={i}>{e}</p>)}</div>
              </div>
            )}

            <div className="border border-border rounded-md overflow-auto max-h-[320px]">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-accent/50">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Agent</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Strategy</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Connected agents</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Warnings</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">{row.agentName}</td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{strategyLabel(row.financials.strategy)}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {(row.financials.connectedAgents ?? []).length === 0
                          ? <span className="italic">none</span>
                          : (row.financials.connectedAgents ?? []).map((ca) => (
                              <span key={ca.id} className="inline-block mr-2">
                                {resolveAgentName(ca.agentId)} ({ca.label}, {ca.rate}%)
                              </span>
                            ))
                        }
                      </td>
                      <td className="px-3 py-2">
                        {row.warnings.length > 0
                          ? <span className="text-amber-600">{row.warnings.join("; ")}</span>
                          : <span className="text-green-600">OK</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-[16px] font-semibold text-foreground">{updatedCount} Agent(s) Updated</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              Commission strategies and connected agents have been applied.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === "upload" && <Button variant="outline" onClick={handleClose}>Cancel</Button>}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={handleApply}>Apply to {parsed.length} agent(s)</Button>
            </>
          )}
          {step === "success" && <Button onClick={handleClose}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
