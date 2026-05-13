import { useRef, useState } from "react";
import { sharedDocumentRequirementTemplates } from "@huspy/shared-domain";
import type { DocumentRequirementTemplate, Market, Country, BusinessUnit } from "@huspy/shared-domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Upload, Download, FileText } from "lucide-react";

const BUSINESS_UNITS: BusinessUnit[] = ["rebu", "mortgage"];
const MARKETS: Market[] = ["primary", "secondary", "leasing"];
const COUNTRIES: Country[] = ["ae", "es", "sa"];

const BU_LABELS: Record<BusinessUnit, string> = {
  rebu: "Real Estate",
  mortgage: "Mortgage",
};

const MARKET_LABELS: Record<Market, string> = {
  primary: "Primary",
  secondary: "Secondary",
  leasing: "Leasing",
};

const COUNTRY_LABELS: Record<Country, string> = {
  ae: "UAE",
  es: "Spain",
  sa: "Saudi Arabia",
};

type CellState = "required" | "optional" | "off";

type TemplateFileMap = Record<string, File>;

export function DocRequirementsView() {
  const [templates, setTemplates] = useState<DocumentRequirementTemplate[]>([
    ...sharedDocumentRequirementTemplates,
  ]);
  const [bu, setBu] = useState<BusinessUnit>("rebu");
  const [market, setMarket] = useState<Market>("primary");
  const [addLabel, setAddLabel] = useState<string | null>(null);

  const templateFilesRef = useRef<TemplateFileMap>({});
  const [templateFileNames, setTemplateFileNames] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

  const scopedTemplates = templates.filter(
    (t) => t.market === market && t.businessUnit === bu
  );

  const rowLabels = [...new Set(scopedTemplates.map((t) => t.label))];

  const cellKey = (label: string, country: Country) =>
    `${bu}:${market}:${label}:${country}`;

  const cellState = (label: string, country: Country): CellState => {
    const tmpl = scopedTemplates.find(
      (t) => t.label === label && t.country === country
    );
    if (!tmpl) return "off";
    return tmpl.required ? "required" : "optional";
  };

  const cycleCell = (label: string, country: Country) => {
    const current = cellState(label, country);
    setTemplates((prev) => {
      const idx = prev.findIndex(
        (t) =>
          t.market === market &&
          t.businessUnit === bu &&
          t.label === label &&
          t.country === country
      );
      if (current === "off") {
        return [
          ...prev,
          {
            id: `tmpl-${bu}-${market}-${country}-${Date.now()}`,
            market,
            businessUnit: bu,
            country,
            label,
            required: true,
          },
        ];
      }
      if (current === "required") {
        return prev.map((t, i) => (i === idx ? { ...t, required: false } : t));
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const removeRow = (label: string) => {
    setTemplates((prev) =>
      prev.filter(
        (t) => !(t.market === market && t.businessUnit === bu && t.label === label)
      )
    );
    setTemplateFileNames((prev) => {
      const next = { ...prev };
      COUNTRIES.forEach((c) => {
        const k = cellKey(label, c);
        delete templateFilesRef.current[k];
        delete next[k];
      });
      return next;
    });
  };

  const commitAddRow = () => {
    if (!addLabel?.trim()) return;
    const newEntries: DocumentRequirementTemplate[] = COUNTRIES.map((c) => ({
      id: `tmpl-${bu}-${market}-${c}-${Date.now()}`,
      market,
      businessUnit: bu,
      country: c,
      label: addLabel.trim(),
      required: false,
    }));
    setTemplates((prev) => [...prev, ...newEntries]);
    setAddLabel(null);
  };

  const triggerTemplateUpload = (label: string, country: Country) => {
    uploadTargetRef.current = cellKey(label, country);
    fileInputRef.current?.click();
  };

  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const key = uploadTargetRef.current;
    if (!file || !key) return;
    templateFilesRef.current[key] = file;
    setTemplateFileNames((prev) => ({ ...prev, [key]: file.name }));
    e.target.value = "";
    uploadTargetRef.current = null;
  };

  const handleTemplateDownload = (label: string, country: Country) => {
    const key = cellKey(label, country);
    const file = templateFilesRef.current[key];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChosen}
      />

      {/* BU tabs */}
      <div className="flex gap-1 mb-4 bg-accent rounded-lg p-1 w-fit">
        {BUSINESS_UNITS.map((b) => (
          <button
            key={b}
            onClick={() => { setBu(b); setAddLabel(null); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              bu === b
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {BU_LABELS[b]}
          </button>
        ))}
      </div>

      {/* Market tabs */}
      <div className="flex gap-3 mb-5 border-b border-border">
        {MARKETS.map((m) => (
          <button
            key={m}
            onClick={() => { setMarket(m); setAddLabel(null); }}
            className={`pb-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              market === m
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {MARKET_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Matrix table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                Document
              </th>
              {COUNTRIES.map((c) => (
                <th
                  key={c}
                  className="text-center px-4 py-2.5 font-medium text-muted-foreground w-44"
                >
                  {COUNTRY_LABELS[c]}
                </th>
              ))}
              <th className="px-4 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {rowLabels.length === 0 && addLabel === null && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground text-xs"
                >
                  No document requirements configured for {BU_LABELS[bu]} — {MARKET_LABELS[market]}.
                  <br />Use "Add document" below to define the first requirement.
                </td>
              </tr>
            )}

            {rowLabels.map((label, i) => (
              <tr
                key={label}
                className={`border-b border-border last:border-0 ${
                  i % 2 === 0 ? "" : "bg-muted/20"
                }`}
              >
                <td className="px-4 py-3 font-medium text-foreground align-top">
                  {label}
                </td>

                {COUNTRIES.map((c) => {
                  const state = cellState(label, c);
                  const key = cellKey(label, c);
                  const fileName = templateFileNames[key];
                  return (
                    <td key={c} className="px-4 py-3 text-center align-top">
                      <div className="flex flex-col items-center gap-1.5">
                        <button
                          onClick={() => cycleCell(label, c)}
                          className="inline-flex items-center justify-center group"
                          title="Click to cycle: Required → Optional → Off"
                        >
                          {state === "required" ? (
                            <Badge className="bg-primary text-primary-foreground text-[11px] cursor-pointer">
                              Required
                            </Badge>
                          ) : state === "optional" ? (
                            <Badge variant="outline" className="text-[11px] cursor-pointer">
                              Optional
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/40 text-xs group-hover:text-muted-foreground transition-colors">
                              —
                            </span>
                          )}
                        </button>

                        {fileName ? (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span
                              className="text-[11px] text-muted-foreground truncate max-w-[80px]"
                              title={fileName}
                            >
                              {fileName}
                            </span>
                            <button
                              onClick={() => handleTemplateDownload(label, c)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title="Download template"
                            >
                              <Download className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => triggerTemplateUpload(label, c)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title="Replace template"
                            >
                              <Upload className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => triggerTemplateUpload(label, c)}
                            className="flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                            title="Upload template for this country"
                          >
                            <Upload className="h-3 w-3" />
                            template
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}

                <td className="px-2 py-3 text-center align-top">
                  <button
                    onClick={() => removeRow(label)}
                    className="text-muted-foreground/40 hover:text-destructive transition-colors mt-0.5"
                    title="Remove row"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}

            {/* Add row form */}
            {addLabel !== null && (
              <tr className="border-t border-border bg-accent/40">
                <td className="px-4 py-2.5">
                  <input
                    className="h-7 text-xs border border-border rounded px-2 bg-background w-56"
                    placeholder="Document name (e.g. Buyer Passport)"
                    value={addLabel}
                    onChange={(e) => setAddLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitAddRow();
                      if (e.key === "Escape") setAddLabel(null);
                    }}
                    autoFocus
                  />
                </td>
                {COUNTRIES.map((c) => (
                  <td key={c} className="px-4 py-2.5 text-center">
                    <span className="text-muted-foreground/40 text-xs">—</span>
                  </td>
                ))}
                <td className="px-2 py-2.5">
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      className="h-6 text-[11px] px-2"
                      onClick={commitAddRow}
                      disabled={!addLabel.trim()}
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[11px] px-2"
                      onClick={() => setAddLabel(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[12px]"
          onClick={() => setAddLabel("")}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add document
        </Button>
        <p className="text-xs text-muted-foreground">
          Click a cell to cycle: Required → Optional → Off. Changes apply to new deals only.
        </p>
      </div>
    </div>
  );
}
