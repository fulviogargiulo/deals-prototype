import {
  sharedPnlEntries,
  sharedDealParticipants,
  sharedParties,
  sharedDealDocumentRequirements,
  sharedDealComments,
  sharedPostings,
  sharedPostingLines,
  sharedInvoices,
  sharedDocuments,
} from "@huspy/shared-domain";

// Version prefix — bump when fixture shape changes to avoid stale-cache bugs.
const V = "karvel-v1";

const KEYS = {
  pnlEntries:      `${V}-pnl-entries`,
  participants:    `${V}-deal-participants`,
  parties:         `${V}-parties`,
  docRequirements: `${V}-doc-requirements`,
  comments:        `${V}-deal-comments`,
  postings:        `${V}-postings`,
  postingLines:    `${V}-posting-lines`,
  invoices:        `${V}-invoices`,
  documents:       `${V}-documents`,
};

function hydrate<T>(arr: T[], key: string): void {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const data: T[] = JSON.parse(raw);
    arr.length = 0;
    // Use prototype.push directly to bypass any prior patching.
    Array.prototype.push.apply(arr, data as any);
  } catch {}
}

function autoPersist<T>(arr: T[], key: string): void {
  const save = () => {
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch {}
  };
  const origPush = Array.prototype.push;
  const origSplice = Array.prototype.splice;
  (arr as any).push = (...items: T[]) => {
    const r = origPush.apply(arr, items as any[]);
    save();
    return r;
  };
  (arr as any).splice = (...args: any[]) => {
    const r = origSplice.apply(arr, args as any);
    save();
    return r;
  };
}

/**
 * Call once, synchronously, before React renders.
 * Hydrates all shared entity arrays from localStorage (overriding fixture defaults)
 * and patches them to auto-save on every push/splice.
 */
export function initSharedEntityStore(): void {
  const entries: [any[], string][] = [
    [sharedPnlEntries,               KEYS.pnlEntries],
    [sharedDealParticipants,         KEYS.participants],
    [sharedParties,                  KEYS.parties],
    [sharedDealDocumentRequirements, KEYS.docRequirements],
    [sharedDealComments,             KEYS.comments],
    [sharedPostings,                 KEYS.postings],
    [sharedPostingLines,             KEYS.postingLines],
    [sharedInvoices,                 KEYS.invoices],
    [sharedDocuments,                KEYS.documents],
  ];
  for (const [arr, key] of entries) {
    hydrate(arr, key);
    autoPersist(arr, key);
  }
}

/** Explicitly save a single array after a property-level mutation (not push/splice). */
export function saveDocumentRequirements(): void {
  try { localStorage.setItem(KEYS.docRequirements, JSON.stringify(sharedDealDocumentRequirements)); } catch {}
}

export function saveSharedInvoices(): void {
  try { localStorage.setItem(KEYS.invoices, JSON.stringify(sharedInvoices)); } catch {}
}

/** Reset all persisted entity state (dev/testing utility). */
export function clearSharedEntityStore(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}
