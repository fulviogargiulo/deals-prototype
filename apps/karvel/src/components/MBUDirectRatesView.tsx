import { useState } from "react";
import { Upload } from "lucide-react";
import { sharedMBUDirectRates, DEFAULT_EXTERNAL_REFERRAL_RATE } from "@huspy/shared-domain";
import { MBUDirectRateUploadDialog } from "./MBUDirectRateUploadDialog";

const CHANNELS = ["REA", "DS", "B2C"] as const;

export function MBUDirectRatesView() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [, forceUpdate] = useState(0);

  const months = [...new Set(sharedMBUDirectRates.map((r) => r.reportingMonth))].sort((a, b) =>
    b.localeCompare(a)
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <p className="text-[13px] text-muted-foreground">
          Monthly commission rates for MBU direct channels (REA, DS, B2C).
          Rates are applied to bank commission (gross revenue Huspy receives from the bank).
        </p>
        <button
          className="ml-4 shrink-0 flex items-center gap-2 px-3 py-2 rounded-md border border-border text-[12px] text-muted-foreground hover:bg-accent transition-colors"
          onClick={() => setUploadOpen(true)}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload CSV
        </button>
      </div>

      <div className="bg-muted/40 border border-border rounded-lg px-4 py-3 mb-6 text-[12px] text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">How rates are applied</p>
        <p>Rates are looked up by <span className="font-medium">reporting month + channel</span> at calculation time.</p>
        <p><span className="font-medium">Self-sourced</span> rate applies when no referral party is linked to the deal.</p>
        <p><span className="font-medium">Externally sourced</span> rate applies when a referral party (acquisition cost) is present. The referral party receives <span className="font-medium">{DEFAULT_EXTERNAL_REFERRAL_RATE}%</span> of bank commission by default.</p>
        <p className="text-[11px] opacity-70">Example: Bank commission AED 10,000 · REA self-sourced 25% → agent payout AED 2,500</p>
      </div>

      {months.length === 0 ? (
        <p className="text-[13px] text-muted-foreground text-center py-12">No rates configured. Upload a CSV to get started.</p>
      ) : (
        <div className="space-y-3">
          {months.map((month) => {
            const rows = sharedMBUDirectRates.filter((r) => r.reportingMonth === month);
            return (
              <div key={month} className="border border-border rounded-lg bg-card overflow-hidden">
                <div className="px-4 py-3 bg-accent/30 border-b border-border">
                  <span className="text-[14px] font-semibold text-foreground">{month}</span>
                  <span className="ml-3 text-[11px] text-muted-foreground">{rows.length} channel{rows.length !== 1 ? "s" : ""}</span>
                </div>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-border bg-accent/10">
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Channel</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Self-sourced rate</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Externally sourced rate</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Referral fee (default)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {CHANNELS.map((ch) => {
                      const row = rows.find((r) => r.channel === ch);
                      return (
                        <tr key={ch} className={!row ? "opacity-40" : ""}>
                          <td className="px-4 py-2.5 font-medium text-foreground">{ch}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-foreground">
                            {row ? `${row.selfSourcedRate}%` : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-foreground">
                            {row ? `${row.externalSourcedRate}%` : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                            {row ? `${DEFAULT_EXTERNAL_REFERRAL_RATE}%` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      <MBUDirectRateUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onImported={() => { setUploadOpen(false); forceUpdate((n) => n + 1); }}
      />
    </div>
  );
}
