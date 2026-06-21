// Cross-reference detection between mentions of a single article.
//
// Ported from experiments/il-filo.jsx (lines 29-56), adapted to the real
// articles.jsonl field names: a mention's name lives in `stringa_ricerca`
// and its role text in `ruolo_articolo`.

/**
 * Normalize a string for accent-insensitive, case-insensitive matching:
 * strip diacritics, lowercase, and turn quote characters into spaces.
 *
 * @param {string} s
 * @returns {string}
 */
export function strip(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[«»"'‘’]/g, " ");
}

// Entity types for which a trailing-name short form is meaningful (people and
// characters go by surname). Reducing a WORK title to its last word is wrong —
// e.g. "Paradosso… di Sartre" must not match every mention of Sartre — so
// non-person types match on their full name only.
const SURNAME_TYPES = new Set(["PER", "CHR"]);

/**
 * Surname / short-form variants of a name so that, e.g., "Bersani" links to
 * "Pier Luigi Bersani". The surname form is only derived for person-like types
 * (PER, CHR); other types match on their full name to avoid false positives
 * from titles that end in a person's name. Returns stripped forms longer than
 * three characters.
 *
 * @param {string} name
 * @param {string} [tipo] - Entity type; controls surname reduction.
 * @returns {string[]}
 */
export function variants(name, tipo) {
  const v = new Set([name]);
  if (SURNAME_TYPES.has(tipo)) {
    const parts = name.split(/\s+/).filter((w) => /^[A-ZÀ-Ý]/.test(w) && w.length > 3);
    if (parts.length > 1) v.add(parts[parts.length - 1]); // surname
  }
  return [...v].map(strip).filter((x) => x.length > 3);
}

/**
 * For each mention, find the original indices of the other mentions whose
 * name (or surname) appears in its role text.
 *
 * Runs once over the mentions in original file order, so the returned indices
 * are stable across both the "globale" and "categoria" views.
 *
 * @param {Array<{stringa_ricerca: string, ruolo_articolo: string}>} mentions
 * @returns {number[][]} For each mention (by original index), the original
 *   indices of the mentions it references.
 */
export function buildLinks(mentions) {
  const idx = mentions.map((m, i) => ({ i, vs: variants(m.stringa_ricerca, m.tipo) }));
  return mentions.map((m, i) => {
    const role = strip(m.ruolo_articolo);
    const refs = [];
    for (const other of idx) {
      if (other.i === i) continue;
      if (other.vs.some((v) => role.includes(v))) refs.push(other.i);
    }
    return refs;
  });
}

/**
 * Build the bidirectional connection network for an article.
 *
 * For each mention (by original index) returns:
 *  - `out`: mentions this one names (outgoing, = buildLinks[i]).
 *  - `in`: mentions that name this one (incoming), minus any already in `out`
 *    so a mutual edge is shown once.
 *
 * @param {Array<{stringa_ricerca: string, ruolo_articolo: string, tipo: string}>} mentions
 * @returns {Array<{out: number[], in: number[]}>}
 */
export function buildNetwork(mentions) {
  const out = buildLinks(mentions);

  // Invert `out` to get incoming edges.
  const incoming = mentions.map(() => []);
  out.forEach((refs, i) => {
    for (const j of refs) incoming[j].push(i);
  });

  return mentions.map((m, i) => {
    const outSet = new Set(out[i]);
    const inArr = incoming[i].filter((j) => !outSet.has(j));
    return { out: out[i], in: inArr };
  });
}
