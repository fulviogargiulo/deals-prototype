// Property type configuration with parent types and their subtypes

export interface PropertySubtype {
  id: string;
  label: string;
}

export interface PropertyParentType {
  id: string;
  label: string;
  subtypes: PropertySubtype[];
}

export const propertyTypes: PropertyParentType[] = [
  {
    id: 'apartment',
    label: 'Apartment',
    subtypes: [
      { id: 'apartment', label: 'Apartment' },
      { id: 'penthouse', label: 'Penthouse' },
      { id: 'duplex', label: 'Duplex' },
      { id: 'loft', label: 'Loft' },
    ],
  },
  {
    id: 'house',
    label: 'House',
    subtypes: [
      { id: 'house', label: 'House' },
      { id: 'semi-detached', label: 'Semi-detached town house' },
      { id: 'townhouse', label: 'Town house' },
      { id: 'rustic', label: 'Rustic house' },
      { id: 'villa', label: 'Villa' },
    ],
  },
  {
    id: 'office',
    label: 'Office',
    subtypes: [],
  },
  {
    id: 'shop',
    label: 'Shop',
    subtypes: [],
  },
  {
    id: 'factory',
    label: 'Factory',
    subtypes: [],
  },
  {
    id: 'building',
    label: 'Building',
    subtypes: [
      { id: 'commercial-building', label: 'Commercial building' },
      { id: 'residential-building', label: 'Residential building' },
    ],
  },
  {
    id: 'land',
    label: 'Land',
    subtypes: [
      { id: 'commercial-plot', label: 'Commercial plot' },
      { id: 'residential-plot', label: 'Residential plot' },
      { id: 'non-buildable', label: 'Non-buildable plot' },
    ],
  },
  {
    id: 'storage',
    label: 'Storage',
    subtypes: [
      { id: 'storage', label: 'Storage' },
      { id: 'warehouse', label: 'Warehouse' },
    ],
  },
  {
    id: 'garage',
    label: 'Garage',
    subtypes: [],
  },
];

// Property types that require additional unit fields (floor, block, unit type)
export const unitRequiredPropertyTypes = ['apartment', 'shop', 'office'];

// Check if a property type requires unit details
export function requiresUnitDetails(parentTypeId: string): boolean {
  return unitRequiredPropertyTypes.includes(parentTypeId);
}

// Floor options from basement to floor 100
export const floorOptions = [
  { value: 'basement-3', label: 'Basement -3' },
  { value: 'basement-2', label: 'Basement -2' },
  { value: 'basement-1', label: 'Basement -1' },
  { value: 'ground', label: 'Ground floor' },
  ...Array.from({ length: 100 }, (_, i) => ({
    value: `floor-${i + 1}`,
    label: `Floor ${i + 1}`,
  })),
];

// Unit type options
export const unitTypeOptions = [
  { value: 'single-door', label: 'Single door' },
  { value: 'letter-number', label: 'Letter/number or both' },
  { value: 'directional', label: 'Directional' },
];

// Directional options
export const directionalOptions = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'center', label: 'Center' },
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
  { value: 'interior', label: 'Interior' },
  { value: 'exterior', label: 'Exterior' },
];

// Address visibility options
export const addressVisibilityOptions = [
  { value: 'street-only', label: 'Street name only', description: 'Only the street name will be shown' },
  { value: 'full-address', label: 'Full address', description: 'Complete address including number and unit' },
  { value: 'hidden', label: 'Hide address', description: 'Address will not be shown to buyers' },
];
