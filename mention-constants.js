// Shared entity-type constants for the Mention Explorer.
// Kept in their own module so both the explorer shell and the row/role
// components can import them without circular dependencies.

/** Human-readable Italian labels per entity type. */
export const TYPE_LABELS = {
  PER: "Persona",
  LOC: "Luogo",
  ORG: "Organizzazione",
  EVT: "Evento",
  ART: "Opera/Oggetto",
  CHR: "Personaggio",
};

/** Strong "ink" color per entity type, used for tags and inline links. */
export const TYPE_COLORS = {
  PER: "#c2410c",
  LOC: "#0e7490",
  ORG: "#6d28d9",
  EVT: "#b45309",
  ART: "#15803d",
  CHR: "#be185d",
};

/**
 * Pale background tint per entity type (ported from il-filo's "soft" values),
 * used for the brief flash highlight when a cross-reference is followed.
 */
export const TYPE_SOFT = {
  PER: "#f3e3e0",
  ART: "#e0ece6",
  ORG: "#f0e8d6",
  LOC: "#dde7ef",
  EVT: "#ece0ec",
  CHR: "#fbe4ee",
};
