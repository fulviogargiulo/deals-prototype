import { Deal } from "./types";
import { mockDeals } from "./mockDeals";

// Simple in-memory store so dynamically created deals are accessible across pages
let allDeals: Deal[] = [...mockDeals];

export function getDeals(): Deal[] {
  return allDeals;
}

export function setDeals(deals: Deal[]): void {
  allDeals = deals;
}

export function addDeals(deals: Deal[]): void {
  allDeals = [...deals, ...allDeals];
}

export function findDeal(id: string): Deal | undefined {
  return allDeals.find((d) => d.id === id);
}

export function updateDeal(updated: Deal): void {
  allDeals = allDeals.map((d) => (d.id === updated.id ? updated : d));
}
