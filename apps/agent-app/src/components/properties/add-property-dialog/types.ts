import { MockAddress } from "@/lib/mock-addresses";

export interface PropertyDraftData {
  // Step 1: Client
  clientId: string | null;
  
  // Step 2: Intent
  intent: 'sell' | 'lease' | null;
  
  // Step 3: Property Type
  parentType: string | null;
  subType: string | null;
  
  // Step 4: Address
  address: MockAddress | null;
  block?: string;
  floor?: string;
  unitType?: string;
  unit?: string;
  
  // Step 5: Visibility
  addressVisibility: 'street-only' | 'full-address' | 'hidden' | null;
}

export const initialPropertyDraftData: PropertyDraftData = {
  clientId: null,
  intent: 'sell', // Pre-select sell
  parentType: 'apartment', // Pre-select apartment
  subType: 'apartment', // Pre-select apartment subtype
  address: null,
  block: '',
  floor: '',
  unitType: '',
  unit: '',
  addressVisibility: null,
};

export type AddPropertyStep = 1 | 2 | 3 | 4 | 5;

// Props for pre-filling data when opening from an opportunity
export interface AddPropertyDialogInitialData {
  intent?: 'sell' | 'lease';
  clientId?: string;
}

// Data returned when a property is created
export interface CreatedPropertyData {
  id: string;
  title: string;
  image: string;
  price?: number;
  bedrooms?: number;
  size?: number;
  status: 'draft';
}
