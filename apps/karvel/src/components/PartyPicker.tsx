import { useState, useRef, useEffect } from "react";
import { sharedParties } from "@huspy/shared-domain";
import type { Party } from "@huspy/shared-domain";

interface PickerState {
  search: string;
  showDropdown: boolean;
  selectedParty: { id: string; displayName: string } | null;
  newPartyMode: boolean;
  newParty: { displayName: string; legalType: string; taxId: string };
  amountStr: string;
}

const RESET: PickerState = {
  search: "",
  showDropdown: false,
  selectedParty: null,
  newPartyMode: false,
  newParty: { displayName: "", legalType: "individual", taxId: "" },
  amountStr: "",
};

interface Props {
  label: string;
  currency: string;
  amountLabel: string;
  requireAmount?: boolean;
  excludePartyIds?: string[];
  onConfirm: (partyId: string, displayName: string, amount: number | undefined) => void;
  onCancel: () => void;
}

export function PartyPicker({
  label,
  currency,
  amountLabel,
  requireAmount = false,
  excludePartyIds = [],
  onConfirm,
  onCancel,
}: Props) {
  const [form, setForm] = useState<PickerState>(RESET);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!form.showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setForm((f) => ({ ...f, showDropdown: false }));
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [form.showDropdown]);

  const eligible = sharedParties.filter(
    (p) =>
      !p.id.startsWith("party-agent-") &&
      !p.id.startsWith("party-conv-") &&
      !excludePartyIds.includes(p.id)
  );

  const results =
    form.search.length >= 2
      ? eligible
          .filter(
            (p) =>
              p.displayName.toLowerCase().includes(form.search.toLowerCase()) ||
              p.taxId?.toLowerCase().startsWith(form.search.toLowerCase())
          )
          .slice(0, 6)
      : [];

  const showNoMatch = results.length === 0 && form.search.length >= 2 && !form.newPartyMode;

  const handleSelect = (partyId: string) => {
    const p = sharedParties.find((x) => x.id === partyId);
    setForm((f) => ({ ...f, selectedParty: { id: partyId, displayName: p?.displayName ?? partyId }, showDropdown: false }));
  };

  const handleCreate = () => {
    if (!form.newParty.displayName || !form.newParty.taxId) return;
    const existing = sharedParties.find((p) => p.taxId === form.newParty.taxId);
    if (existing) {
      setForm((f) => ({ ...f, selectedParty: { id: existing.id, displayName: existing.displayName }, newPartyMode: false }));
      return;
    }
    const party: Party = {
      id: `party-ext-${Date.now()}`,
      displayName: form.newParty.displayName,
      legalType: form.newParty.legalType,
      taxId: form.newParty.taxId,
    };
    sharedParties.push(party);
    setForm((f) => ({ ...f, selectedParty: { id: party.id, displayName: party.displayName }, newPartyMode: false }));
  };

  const canConfirm =
    form.selectedParty != null &&
    (!requireAmount || (form.amountStr !== "" && parseFloat(form.amountStr) > 0));

  return (
    <div className="bg-muted/30 border border-border/60 rounded-md px-3 py-3 space-y-2.5">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>

      {!form.selectedParty ? (
        <>
          {!form.newPartyMode ? (
            <div className="relative" ref={dropdownRef}>
              <input
                type="text"
                autoFocus
                value={form.search}
                onChange={(e) => setForm((f) => ({ ...f, search: e.target.value, showDropdown: true }))}
                placeholder="Search by name or tax ID…"
                className="w-full px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {form.showDropdown && (results.length > 0 || showNoMatch) && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg overflow-hidden">
                  {results.map((p) => (
                    <button
                      key={p.id}
                      onMouseDown={() => handleSelect(p.id)}
                      className="w-full text-left px-3 py-2 text-[13px] hover:bg-muted flex items-center justify-between gap-4"
                    >
                      <span>{p.displayName}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{p.taxId}</span>
                    </button>
                  ))}
                  {showNoMatch && (
                    <button
                      onMouseDown={() =>
                        setForm((f) => ({
                          ...f,
                          newPartyMode: true,
                          newParty: { ...f.newParty, taxId: f.search },
                          showDropdown: false,
                        }))
                      }
                      className="w-full text-left px-3 py-2 text-[13px] text-primary hover:bg-muted"
                    >
                      No match — create new party for "{form.search}"
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                autoFocus
                type="text"
                value={form.newParty.displayName}
                onChange={(e) => setForm((f) => ({ ...f, newParty: { ...f.newParty, displayName: e.target.value } }))}
                placeholder="Full name / company"
                className="flex-1 min-w-[140px] px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                type="text"
                value={form.newParty.taxId}
                onChange={(e) => setForm((f) => ({ ...f, newParty: { ...f.newParty, taxId: e.target.value } }))}
                placeholder="Tax ID"
                className="w-28 px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <select
                value={form.newParty.legalType}
                onChange={(e) => setForm((f) => ({ ...f, newParty: { ...f.newParty, legalType: e.target.value } }))}
                className="px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
                <option value="financial_institution">Financial Institution</option>
              </select>
              <button
                onClick={handleCreate}
                disabled={!form.newParty.displayName || !form.newParty.taxId}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-[13px] font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium">{form.selectedParty.displayName}</p>
            <button
              onClick={() => setForm((f) => ({ ...f, selectedParty: null, amountStr: "" }))}
              className="text-[11px] text-muted-foreground hover:text-foreground underline"
            >
              Change
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[12px] text-muted-foreground shrink-0">
              {amountLabel} ({currency})
            </label>
            <input
              autoFocus
              type="number"
              min={0}
              placeholder="0"
              value={form.amountStr}
              onChange={(e) => setForm((f) => ({ ...f, amountStr: e.target.value }))}
              className="w-36 px-2 py-1 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-[13px] text-muted-foreground hover:text-foreground">
          Cancel
        </button>
        <button
          onClick={() =>
            form.selectedParty &&
            onConfirm(
              form.selectedParty.id,
              form.selectedParty.displayName,
              form.amountStr !== "" ? parseFloat(form.amountStr) : undefined
            )
          }
          disabled={!canConfirm}
          className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-[13px] font-semibold hover:opacity-90 disabled:opacity-40"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
