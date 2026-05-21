import { useState } from "react";
import { Upload, ChevronDown, ChevronUp } from "lucide-react";
import { sharedBrokerRateSlabs, sharedParties } from "@huspy/shared-domain";

function bankName(bankId: string): string {
  return sharedParties.find((p) => p.id === bankId)?.displayName ?? bankId;
}

function fmt(pct: number): string {
  return `${pct.toFixed(3)}%`;
}

export default function BrokerRateSlabs() {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(
    sharedBrokerRateSlabs[sharedBrokerRateSlabs.length - 1]?.reportingMonth ?? null
  );

  const sorted = [...sharedBrokerRateSlabs].sort((a, b) =>
    b.reportingMonth.localeCompare(a.reportingMonth)
  );

  return (
    <div className="flex-1 min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-semibold text-foreground tracking-tight">Broker Rate Slabs</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Monthly commission rates for MBU MA/Broker channel.
              Rates are applied to the broker's allocated disbursed amount (% of mortgage principal).
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-[12px] text-muted-foreground hover:bg-accent transition-colors"
            onClick={() => alert("CSV upload not yet implemented")}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload CSV
          </button>
        </div>

        {/* How rates are applied */}
        <div className="bg-muted/40 border border-border rounded-lg px-4 py-3 mb-6 text-[12px] text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">How rates are applied</p>
          <p>Each broker's tier is determined by their <span className="font-medium">total monthly disbursed amount across all banks</span>.</p>
          <p>Payout = <span className="font-medium">broker's mortgage allocation × bank rate</span>, where allocation = split% × disbursed amount.</p>
          <p className="text-[11px] opacity-70">Example: 60% split on AED 2,800,000 at ADIB 0.663% = AED 11,130</p>
        </div>

        {/* Monthly slabs */}
        <div className="space-y-3">
          {sorted.map((config) => {
            const isOpen = expandedMonth === config.reportingMonth;
            return (
              <div key={config.id} className="border border-border rounded-lg bg-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
                  onClick={() => setExpandedMonth(isOpen ? null : config.reportingMonth)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-semibold text-foreground">{config.reportingMonth}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {config.slabs.length} tier{config.slabs.length !== 1 ? "s" : ""} ·{" "}
                      {config.slabs[0]?.bankRates.length ?? 0} banks
                    </span>
                  </div>
                  {isOpen
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="border-t border-border divide-y divide-border">
                    {config.slabs.map((slab, i) => {
                      const tierLabel = slab.upTo == null
                        ? `Tier ${i + 1} — ≥ AED ${(config.slabs[i - 1]?.upTo ?? 0).toLocaleString()}`
                        : `Tier ${i + 1} — up to AED ${slab.upTo.toLocaleString()}`;
                      return (
                        <div key={i} className="px-4 py-3">
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            {tierLabel}
                          </p>
                          <table className="w-full text-[12px]">
                            <thead>
                              <tr className="text-muted-foreground">
                                <th className="text-left font-medium pb-1">Bank</th>
                                <th className="text-right font-medium pb-1">Rate (% of disbursed)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {slab.bankRates.map((rate) => (
                                <tr key={rate.bankId} className="border-t border-border/40">
                                  <td className="py-1.5 text-foreground">{bankName(rate.bankId)}</td>
                                  <td className="py-1.5 text-right font-mono text-foreground">{fmt(rate.pct)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sorted.length === 0 && (
          <p className="text-[13px] text-muted-foreground text-center py-12">No rate slabs configured.</p>
        )}
      </div>
    </div>
  );
}
