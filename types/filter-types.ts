/**
 * Trip Filter Types
 *
 * Shared type definitions for the trips filtering system.
 * Used by the sidebar UI, Gemini NL prompt, and client-side filter logic.
 */

export interface TripFilter {
  priceMin?: number;
  priceMax?: number;
  durationMin?: number; // in days (normalized from hours/nights)
  durationMax?: number;
  categories?: string[]; // any match (OR within, AND across filters)
  interests?: string[];
  languages?: string[];
  startingPoint?: string; // fuzzy text match
  textSearch?: string; // free-text search across name, description, highlights
}

/** Duration presets used by the sidebar button grid */
export interface DurationPreset {
  label: string;
  min: number;
  max: number | null; // null = no upper bound (15+ days)
}

export const DURATION_PRESETS: DurationPreset[] = [
  { label: "1-3 Days", min: 1, max: 3 },
  { label: "4-7 Days", min: 4, max: 7 },
  { label: "8-14 Days", min: 8, max: 14 },
  { label: "15+ Days", min: 15, max: null },
];

/** Filter options extracted from the plans data */
export interface FilterOptions {
  categories: string[];
  interests: string[];
  languages: string[];
  priceRange: { min: number; max: number };
  locations: string[];
}
