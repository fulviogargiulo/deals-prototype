import { Tranche } from "./types";
import { mockTranches } from "./mockTranches";

const STORAGE_KEY = "karvel-tranches";
const STORAGE_VERSION = "2"; // bumped: tranche-026a now finalized with confirmed stake amounts

function loadTranches(): Tranche[] {
  try {
    if (localStorage.getItem(STORAGE_KEY + "-v") !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY + "-v", STORAGE_VERSION);
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Tranche[];
  } catch {}
  return [...mockTranches];
}

function persist(tranches: Tranche[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tranches));
  } catch {}
}

let allTranches: Tranche[] = loadTranches();

export function getTranches(): Tranche[] {
  return allTranches;
}

export function getTranchesForDeal(dealId: string): Tranche[] {
  return allTranches.filter((t) => t.dealId === dealId).sort((a, b) => a.index - b.index);
}

export function findTranche(id: string): Tranche | undefined {
  return allTranches.find((t) => t.id === id);
}

export function setTranches(tranches: Tranche[]): void {
  allTranches = tranches;
  persist(allTranches);
}

export function addTranche(tranche: Tranche): void {
  allTranches = [...allTranches, tranche];
  persist(allTranches);
}

export function updateTranche(updated: Tranche): void {
  allTranches = allTranches.map((t) => (t.id === updated.id ? updated : t));
  persist(allTranches);
}
