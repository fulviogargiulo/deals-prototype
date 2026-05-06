import type { Client as BaseClient } from "@huspy/shared-domain";

export interface Client extends BaseClient {
  // Karvel-only fields
  email: string; // required in karvel even though optional in canonical
  status: "active" | "inactive";
  source: string;
  origin: string;
}
