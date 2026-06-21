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

/**
 * Surname / short-form variants of a name so that, e.g., "Bersani" links to
 * "Pier Luigi Bersani". Returns stripped forms longer than three characters.
 *
 * @param {string} name
 * @returns {string[]}
 */
export function variants(name) {
  const v = new Set([name]);
  const parts = name.split(/\s+/).filter((w) => /^[A-ZÀ-Ý]/.test(w) && w.length > 3);
  if (parts.length > 1) v.add(parts[parts.length - 1]); // surname
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
  const idx = mentions.map((m, i) => ({ i, vs: variants(m.stringa_ricerca) }));
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
