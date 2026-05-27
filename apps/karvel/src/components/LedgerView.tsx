import { useState, useMemo, useEffect } from "react";
import { ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, ArrowLeft, Plus, Upload, Filter, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { sharedLedgers, sharedPostings, sharedPostingLines } from "@huspy/shared-domain";
import type { Ledger, Posting, PostingLine } from "@huspy/shared-domain";
import { PostingDetailDialog } from "@/components/PostingDetailDialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CreatePostingDialog } from "@/components/CreatePostingDialog";
import { thBase, SortDir, SortIcon, FilterDropdown } from "./TableFilters";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, currency = "EUR") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTimestamp(s: string) {
  return new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const PROCESS_LABELS: Record<string, string> = {
  invoice_issued: "Invoice Issued",
  commission_accrual: "Commission",
  external_cost_accrual: "External Cost",
  bank_statement_inbound_matched: "Payment In",
  bank_statement_outbound_matched: "Payment Out",
  payout_instructed: "Payout",
  agent_adjustment: "Adjustment",
  huspy_fee: "Huspy Fee",
  manual_adjustment: "Adjustment",
  reversal: "Reversal",
};

const TYPE_LABEL: Record<string, string> = {
  asset: "Asset",
  liability: "Liability",
  revenue: "Revenue",
  expense: "Expense",
};

const TYPE_ORDER: Record<string, number> = { asset: 0, liability: 1, revenue: 2, expense: 3 };

function computeBalance(ledgerId: number, type: string, allLines: PostingLine[], includeSubledgers = false) {
  const ids = new Set([ledgerId]);
  if (includeSubledgers) {
    sharedLedgers.filter((l) => l.glId === ledgerId).forEach((l) => ids.add(l.id));
  }
  const lines = allLines.filter((l) => ids.has(l.ledgerId));
  const credits = lines.filter((l) => l.side === "CREDIT").reduce((s, l) => s + l.amount, 0);
  const debits = lines.filter((l) => l.side === "DEBIT").reduce((s, l) => s + l.amount, 0);
  // Asset & Expense normal balance is Debit; Liability & Revenue normal balance is Credit
  return (type === "asset" || type === "expense") ? debits - credits : credits - debits;
}

// ─── Drilldown state ──────────────────────────────────────────────────────────

type DrilldownState =
  | { level: "gl" }
  | { level: "subledger"; glLedger: Ledger }
  | { level: "lines"; ledger: Ledger; glLedger: Ledger | null };

// ─── Main component ───────────────────────────────────────────────────────────

export function LedgerView() {
  const navigate = useNavigate();
  const [drilldown, setDrilldown] = useState<DrilldownState>({ level: "gl" });
  const [selectedPostingId, setSelectedPostingId] = useState<string | null>(null);

  const [manualPostings, setManualPostings] = useState<Posting[]>([]);
  const [manualPostingLines, setManualPostingLines] = useState<PostingLine[]>([]);
  const [postingOverrides, setPostingOverrides] = useState<Record<string, Partial<Posting>>>({});
  const [createPostingOpen, setCreatePostingOpen] = useState(false);

  // GL filters & sort
  const [glTypeFilter, setGLTypeFilter] = useState<Set<string>>(new Set());
  const [glCurrencyFilter, setGLCurrencyFilter] = useState<Set<string>>(new Set());
  const [glSortKey, setGLSortKey] = useState<"name" | "balance" | null>(null);
  const [glSortDir, setGLSortDir] = useState<SortDir>(null);

  // Subledger sort
  const [subSortKey, setSubSortKey] = useState<"name" | "balance" | null>(null);
  const [subSortDir, setSubSortDir] = useState<SortDir>(null);

  // Lines sort & filter
  const [linesSortKey, setLinesSortKey] = useState<"createdAt" | "valueDate" | null>("valueDate");
  const [linesSortDir, setLinesSortDir] = useState<SortDir>("asc");
  const [linesProcessFilter, setLinesProcessFilter] = useState<Set<string>>(new Set());
  const [linesPage, setLinesPage] = useState(1);

  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const allPostings: Posting[] = useMemo(
    () => [...sharedPostings, ...manualPostings].map((p) =>
      postingOverrides[p.id] ? { ...p, ...postingOverrides[p.id] } : p,
    ),
    [manualPostings, postingOverrides],
  );
  const allLines: PostingLine[] = useMemo(
    () => [...sharedPostingLines, ...manualPostingLines],
    [manualPostingLines],
  );

  // GL ledgers (filtered + sorted)
  const glLedgers = useMemo(() => {
    const base = sharedLedgers.filter((l) =>
      !l.glId &&
      (glTypeFilter.size === 0 || glTypeFilter.has(l.type)) &&
      (glCurrencyFilter.size === 0 || glCurrencyFilter.has(l.currency ?? "EUR"))
    );
    if (glSortKey && glSortDir) {
      const dir = glSortDir === "asc" ? 1 : -1;
      return [...base].sort((a, b) => {
        if (glSortKey === "name") return a.name.localeCompare(b.name) * dir;
        return (computeBalance(a.id, a.type, allLines, true) - computeBalance(b.id, b.type, allLines, true)) * dir;
      });
    }
    return [...base].sort((a, b) => {
      const ta = TYPE_ORDER[a.type] ?? 99;
      const tb = TYPE_ORDER[b.type] ?? 99;
      return ta !== tb ? ta - tb : a.id - b.id;
    });
  }, [glTypeFilter, glCurrencyFilter, glSortKey, glSortDir, allLines]);

  // Subledgers for current drilldown (sorted)
  const subledgers = useMemo(() => {
    if (drilldown.level !== "subledger") return [];
    const base = sharedLedgers.filter((l) => l.glId === drilldown.glLedger.id);
    if (subSortKey && subSortDir) {
      const dir = subSortDir === "asc" ? 1 : -1;
      return [...base].sort((a, b) => {
        if (subSortKey === "name") return a.name.localeCompare(b.name) * dir;
        return (computeBalance(a.id, a.type, allLines) - computeBalance(b.id, b.type, allLines)) * dir;
      });
    }
    return base;
  }, [drilldown, subSortKey, subSortDir, allLines]);

  // Posting lines for current drilldown (filtered + sorted)
  const postingLines = useMemo(() => {
    if (drilldown.level !== "lines") return [];
    const base = allLines
      .filter((l) => l.ledgerId === drilldown.ledger.id)
      .map((l) => ({ ...l, posting: allPostings.find((p) => p.id === l.postingId) }));
    const filtered = linesProcessFilter.size > 0
      ? base.filter((l) => linesProcessFilter.has(l.posting?.businessProcess ?? ""))
      : base;
    if (linesSortKey && linesSortDir) {
      const dir = linesSortDir === "asc" ? 1 : -1;
      return [...filtered].sort((a, b) => {
        if (linesSortKey === "createdAt") return (a.posting?.createdAt ?? "").localeCompare(b.posting?.createdAt ?? "") * dir;
        return (a.posting?.valueDate ?? "").localeCompare(b.posting?.valueDate ?? "") * dir;
      });
    }
    return filtered;
  }, [drilldown, allLines, allPostings, linesProcessFilter, linesSortKey, linesSortDir]);

  useEffect(() => { setLinesPage(1); }, [postingLines]);

  function handleReversePosting(posting: Posting, lines: PostingLine[]) {
    const reversalId = `reversal-${posting.id}-${Date.now()}`;
    const now = new Date().toISOString();
    const reversalPosting: Posting = {
      id: reversalId,
      dealId: posting.dealId,
      businessUnit: posting.businessUnit,
      externalRef: posting.externalRef,
      businessProcess: "reversal",
      createdBy: "user-ops",
      createdAt: now,
      valueDate: now.slice(0, 10),
      currency: posting.currency,
      description: `Reversal of ${posting.id}`,
    };
    const reversalLines: PostingLine[] = lines.map((l, idx) => ({
      id: `${reversalId}-L${idx + 1}`,
      postingId: reversalId,
      ledgerId: l.ledgerId,
      side: l.side === "DEBIT" ? "CREDIT" : "DEBIT",
      amount: l.amount,
    }));
    setPostingOverrides((prev) => ({ ...prev, [posting.id]: { ...prev[posting.id], reversedByPostingId: reversalId } }));
    setManualPostings((prev) => [...prev, reversalPosting]);
    setManualPostingLines((prev) => [...prev, ...reversalLines]);
    setSelectedPostingId(reversalId);
  }

  function handleGLSort(key: "name" | "balance") {
    if (glSortKey === key) {
      const next = glSortDir === "asc" ? "desc" : glSortDir === "desc" ? null : "asc";
      setGLSortDir(next as SortDir);
      if (!next) setGLSortKey(null);
    } else { setGLSortKey(key); setGLSortDir("asc"); }
  }

  function handleSubSort(key: "name" | "balance") {
    if (subSortKey === key) {
      const next = subSortDir === "asc" ? "desc" : subSortDir === "desc" ? null : "asc";
      setSubSortDir(next as SortDir);
      if (!next) setSubSortKey(null);
    } else { setSubSortKey(key); setSubSortDir("asc"); }
  }

  function handleLinesSort(key: "createdAt" | "valueDate") {
    if (linesSortKey === key) {
      const next = linesSortDir === "asc" ? "desc" : linesSortDir === "desc" ? null : "asc";
      setLinesSortDir(next as SortDir);
      if (!next) setLinesSortKey(null);
    } else { setLinesSortKey(key); setLinesSortDir("asc"); }
  }

  const glActiveFilters = [glTypeFilter, glCurrencyFilter].filter((f) => f.size > 0).length;

  // ── GL ledger list ──────────────────────────────────────────────────────────
  const glContent = (
    <div>
      <div className="flex items-center justify-between mb-4">
        {glActiveFilters > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">
              {glActiveFilters} filter{glActiveFilters > 1 ? "s" : ""} active · {glLedgers.length} ledger{glLedgers.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => { setGLTypeFilter(new Set()); setGLCurrencyFilter(new Set()); }}
              className="text-[12px] text-primary hover:underline"
            >
              Clear all
            </button>
          </div>
        ) : <div />}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md text-[13px] font-medium text-foreground bg-card hover:bg-muted transition-colors">
            <Upload className="h-4 w-4" />
            Upload CSV
          </button>
          <button
            onClick={() => setCreatePostingOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Create Posting
          </button>
        </div>
      </div>
      <div className="bg-card rounded-xl overflow-hidden border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className={`${thBase} text-left relative`}>
                <div className="flex items-center gap-1">
                  <span>Type</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "glType" ? null : "glType"); }}
                    className={`p-0.5 rounded transition-colors ${glTypeFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                  >
                    {glTypeFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                  </button>
                </div>
                {openFilter === "glType" && (
                  <FilterDropdown
                    options={["asset", "liability", "revenue", "expense"]}
                    selected={glTypeFilter}
                    labels={TYPE_LABEL}
                    onChange={(s) => setGLTypeFilter(s)}
                    onClose={() => setOpenFilter(null)}
                  />
                )}
              </th>
              <th className={`${thBase} text-left`}>
                <button onClick={() => handleGLSort("name")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Ledger <SortIcon dir={glSortKey === "name" ? glSortDir : null} />
                </button>
              </th>
              <th className={`${thBase} text-left`}>Description</th>
              <th className={`${thBase} text-left relative`}>
                <div className="flex items-center gap-1">
                  <span>Currency</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "glCurrency" ? null : "glCurrency"); }}
                    className={`p-0.5 rounded transition-colors ${glCurrencyFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                  >
                    {glCurrencyFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                  </button>
                </div>
                {openFilter === "glCurrency" && (
                  <FilterDropdown
                    options={["EUR", "AED", "SAR"]}
                    selected={glCurrencyFilter}
                    onChange={(s) => setGLCurrencyFilter(s)}
                    onClose={() => setOpenFilter(null)}
                  />
                )}
              </th>
              <th className={`${thBase} text-right`}>
                <button onClick={() => handleGLSort("balance")} className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors">
                  Balance <SortIcon dir={glSortKey === "balance" ? glSortDir : null} />
                </button>
              </th>
              <th className={thBase} />
            </tr>
          </thead>
          <tbody>
            {glLedgers.map((ledger) => {
              const hasSubledgers = sharedLedgers.some((l) => l.glId === ledger.id);
              const net = computeBalance(ledger.id, ledger.type, allLines, true);
              const currency = ledger.currency ?? "EUR";
              return (
                <tr
                  key={ledger.id}
                  onClick={() => {
                    if (hasSubledgers) {
                      setDrilldown({ level: "subledger", glLedger: ledger });
                    } else {
                      setDrilldown({ level: "lines", ledger, glLedger: null });
                    }
                  }}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-[13px]">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {TYPE_LABEL[ledger.type] ?? ledger.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] font-semibold">{ledger.name}</td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">{ledger.description ?? "—"}</td>
                  <td className="px-4 py-3 text-[13px]">
                    <span className="text-[12px] font-mono text-muted-foreground">{currency}</span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-right tabular-nums font-semibold text-foreground">
                    {net === 0 ? "—" : `${net > 0 ? "+" : "−"}${fmt(Math.abs(net), currency)}`}
                  </td>
                  <td className="px-4 py-3 w-8">
                    <ChevronRight className={cn("h-4 w-4 ml-auto", hasSubledgers ? "text-muted-foreground" : "text-muted-foreground/20")} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── Subledger list ──────────────────────────────────────────────────────────
  const subledgerContent = drilldown.level === "subledger" ? (() => {
    const { glLedger } = drilldown;
    const glNet = computeBalance(glLedger.id, glLedger.type, allLines, true);
    const currency = glLedger.currency ?? "EUR";

    return (
      <div>
        <button
          onClick={() => setDrilldown({ level: "gl" })}
          className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          GL Ledgers
        </button>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground font-mono">{glLedger.name}</h2>
            {glLedger.description && (
              <p className="text-[12px] text-muted-foreground mt-0.5">{glLedger.description}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Balance</p>
            <p className="text-[20px] font-bold tabular-nums text-foreground">
              {glNet >= 0 ? "+" : "−"}{fmt(Math.abs(glNet), currency)}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl overflow-hidden border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className={`${thBase} text-left`}>
                  <button onClick={() => handleSubSort("name")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Subledger <SortIcon dir={subSortKey === "name" ? subSortDir : null} />
                  </button>
                </th>
                <th className={`${thBase} text-left`}>Description</th>
                <th className={`${thBase} text-right`}>
                  <button onClick={() => handleSubSort("balance")} className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors">
                    Balance <SortIcon dir={subSortKey === "balance" ? subSortDir : null} />
                  </button>
                </th>
                <th className={thBase} />
              </tr>
            </thead>
            <tbody>
              {subledgers.map((sub) => {
                const net = computeBalance(sub.id, sub.type, allLines);
                const subCurrency = sub.currency ?? currency;
                return (
                  <tr
                    key={sub.id}
                    onClick={() => setDrilldown({ level: "lines", ledger: sub, glLedger })}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-[12px] font-semibold">{sub.name}</td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">{sub.description ?? "—"}</td>
                    <td className="px-4 py-3 text-[13px] text-right tabular-nums font-semibold text-foreground"
                    >
                      {net === 0 ? "—" : `${net > 0 ? "+" : "−"}${fmt(Math.abs(net), subCurrency)}`}
                    </td>
                    <td className="px-4 py-3 w-8">
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  })() : null;

  // ── Posting lines ───────────────────────────────────────────────────────────
  const linesContent = drilldown.level === "lines" ? (() => {
    const { ledger, glLedger } = drilldown;
    const currency = ledger.currency ?? "EUR";

    const allLedgerLines = allLines
      .filter((l) => l.ledgerId === ledger.id)
      .map((l) => ({ ...l, posting: allPostings.find((p) => p.id === l.postingId) }));

    const net = computeBalance(ledger.id, ledger.type, allLines);

    const linesActiveFilters = linesProcessFilter.size > 0 ? 1 : 0;

    return (
      <div>
        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-4">
          <button onClick={() => setDrilldown({ level: "gl" })} className="hover:text-foreground transition-colors">
            GL Ledgers
          </button>
          {glLedger && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <button
                onClick={() => setDrilldown({ level: "subledger", glLedger })}
                className="hover:text-foreground transition-colors"
              >
                {glLedger.name}
              </button>
            </>
          )}
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-foreground font-medium">{ledger.name}</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground font-mono">{ledger.name}</h2>
            {ledger.description && (
              <p className="text-[12px] text-muted-foreground mt-0.5">{ledger.description}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Balance</p>
            <p className="text-[20px] font-bold tabular-nums text-foreground">
              {net >= 0 ? "+" : "−"}{fmt(Math.abs(net), currency)}
            </p>
          </div>
        </div>

        {linesActiveFilters > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[12px] text-muted-foreground">
              1 filter active · {postingLines.length} line{postingLines.length !== 1 ? "s" : ""}
            </span>
            <button onClick={() => setLinesProcessFilter(new Set())} className="text-[12px] text-primary hover:underline">
              Clear all
            </button>
          </div>
        )}

        <div className="bg-card rounded-xl overflow-hidden border border-border">
          {allLedgerLines.length === 0 ? (
            <div className="px-4 py-10 text-center text-muted-foreground text-[14px]">No ledger entries found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className={`${thBase} text-left`}>Posting ID</th>
                    <th className={`${thBase} text-left`}>
                      <button onClick={() => handleLinesSort("createdAt")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        Created At <SortIcon dir={linesSortKey === "createdAt" ? linesSortDir : null} />
                      </button>
                    </th>
                    <th className={`${thBase} text-left`}>
                      <button onClick={() => handleLinesSort("valueDate")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        Value Date <SortIcon dir={linesSortKey === "valueDate" ? linesSortDir : null} />
                      </button>
                    </th>
                    <th className={`${thBase} text-left`}>Description</th>
                    <th className={`${thBase} text-left`}>Deal</th>
                    <th className={`${thBase} text-left relative`}>
                      <div className="flex items-center gap-1">
                        <span>Type</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "linesProcess" ? null : "linesProcess"); }}
                          className={`p-0.5 rounded transition-colors ${linesProcessFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                        >
                          {linesProcessFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                        </button>
                      </div>
                      {openFilter === "linesProcess" && (
                        <FilterDropdown
                          options={Object.keys(PROCESS_LABELS)}
                          selected={linesProcessFilter}
                          labels={PROCESS_LABELS}
                          onChange={(s) => setLinesProcessFilter(s)}
                          onClose={() => setOpenFilter(null)}
                        />
                      )}
                    </th>
                    <th className={`${thBase} text-right`}>Debit</th>
                    <th className={`${thBase} text-right`}>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {postingLines.slice((linesPage - 1) * 15, linesPage * 15).map((line) => {
                    const postingCurrency = line.posting?.currency ?? currency;
                    return (
                      <tr
                        key={line.id}
                        onClick={() => setSelectedPostingId(line.postingId)}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{line.postingId}</td>
                        <td className="px-4 py-3 text-[13px]">
                          {line.posting?.createdAt ? fmtTimestamp(line.posting.createdAt) : "—"}
                        </td>
                        <td className="px-4 py-3 text-[13px]">
                          {line.posting ? fmtDate(line.posting.valueDate) : "—"}
                        </td>
                        <td className="px-4 py-3 text-[13px] max-w-[220px] truncate text-muted-foreground">
                          {line.posting?.description ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[13px]">
                          {line.posting?.dealId ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/deals/${line.posting!.dealId}`); }}
                              className="text-primary underline underline-offset-2 hover:opacity-80 font-mono text-[12px]"
                            >
                              {line.posting.dealId}
                            </button>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="capitalize text-[11px]">
                            {line.posting?.businessProcess ?? "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-[14px] tabular-nums font-semibold">
                          {line.side === "DEBIT" ? fmt(line.amount, postingCurrency) : <span className="text-muted-foreground/30">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-[14px] tabular-nums font-semibold">
                          {line.side === "CREDIT" ? fmt(line.amount, postingCurrency) : <span className="text-muted-foreground/30">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {postingLines.length > 15 && (() => {
          const totalPages = Math.ceil(postingLines.length / 15);
          return (
            <div className="flex items-center justify-center gap-2 py-5">
              <button onClick={() => setLinesPage(1)} disabled={linesPage === 1} className="w-8 h-8 flex items-center justify-center rounded border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors">
                <ChevronsLeft className="h-4 w-4 text-foreground" />
              </button>
              <button onClick={() => setLinesPage((p) => Math.max(1, p - 1))} disabled={linesPage === 1} className="w-8 h-8 flex items-center justify-center rounded border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors">
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </button>
              <div className="flex items-center gap-2 text-[14px] mx-1">
                <input type="number" value={linesPage} onChange={(e) => { const v = parseInt(e.target.value); if (v >= 1 && v <= totalPages) setLinesPage(v); }} className="w-12 h-8 text-center border border-border rounded px-1 text-[14px] bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
                <span className="text-muted-foreground">of {totalPages}</span>
              </div>
              <button onClick={() => setLinesPage((p) => Math.min(totalPages, p + 1))} disabled={linesPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors">
                <ChevronRight className="h-4 w-4 text-foreground" />
              </button>
              <button onClick={() => setLinesPage(totalPages)} disabled={linesPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors">
                <ChevronsRight className="h-4 w-4 text-foreground" />
              </button>
            </div>
          );
        })()}
      </div>
    );
  })() : null;

  return (
    <>
      {drilldown.level === "gl" && glContent}
      {drilldown.level === "subledger" && subledgerContent}
      {drilldown.level === "lines" && linesContent}

      <PostingDetailDialog
        postingId={selectedPostingId}
        allPostings={allPostings}
        allLines={allLines}
        open={!!selectedPostingId}
        onOpenChange={(open) => !open && setSelectedPostingId(null)}
        onReverse={(posting, lines) => handleReversePosting(posting, lines)}
      />

      <CreatePostingDialog
        open={createPostingOpen}
        onOpenChange={setCreatePostingOpen}
        onCreated={(posting, lines) => {
          setManualPostings((prev) => [...prev, posting]);
          setManualPostingLines((prev) => [...prev, ...lines]);
          setSelectedPostingId(posting.id);
        }}
      />
    </>
  );
}
