import { Deal } from "./types";
import { mockDeals } from "./mockDeals";

const STORAGE_KEY = "karvel-deals";

function loadDeals(): Deal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Deal[];
  } catch {}
  return [...mockDeals];
}

function persist(deals: Deal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
  } catch {}
}

let allDeals: Deal[] = loadDeals();

export function getDeals(): Deal[] {
  return allDeals;
}

export function setDeals(deals: Deal[]): void {
  allDeals = deals;
  persist(allDeals);
}

export function addDeals(deals: Deal[]): void {
  allDeals = [...deals, ...allDeals];
  persist(allDeals);
}

export function findDeal(id: string): Deal | undefined {
  return allDeals.find((d) => d.id === id);
}

export function updateDeal(updated: Deal): void {
  allDeals = allDeals.map((d) => (d.id === updated.id ? updated : d));
  persist(allDeals);
}
