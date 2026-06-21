import { TYPE_COLORS } from "./mention-constants.js";

// Role text with inline, tappable cross-references.
//
// Ported from experiments/il-filo.jsx (lines 204-269), adapted to real field
// names (`stringa_ricerca`, `tipo`) and the shared TYPE_COLORS map.
//
// For each referenced mention we splice a tappable <button> over the FIRST
// occurrence of its full name or surname in the role text, colored by the
// target's entity type. Longer forms are matched first so a full name wins
// over a bare surname.

const roleStyle = { margin: 0 };

const inlineRefStyle = {
  background: "none",
  border: "none",
  padding: 0,
  font: "inherit",
  cursor: "pointer",
  textDecoration: "underline",
  textDecorationThickness: "1.5px",
  textUnderlineOffset: "2px",
  fontWeight: 600,
};

/**
 * @param {object} props
 * @param {string} props.text - The role text to render.
 * @param {number[]} props.refs - Original indices of referenced mentions.
 * @param {Array<object>} props.mentions - All mentions (original order).
 * @param {(originalIdx: number) => void} props.onFollow - Called when a link is tapped.
 */
export default function Role({ text, refs, mentions, onFollow }) {
  const targets = refs
    .map((ri) => {
      const m = mentions[ri];
      const parts = m.stringa_ricerca.split(/\s+/);
      const surname = parts.length > 1 ? parts[parts.length - 1] : m.stringa_ricerca;
      return { ri, forms: [m.stringa_ricerca, surname].filter((f) => f.length > 3) };
    })
    .sort((a, b) => b.forms[0].length - a.forms[0].length);

  let segs = [{ text, ref: null }];
  for (const tgt of targets) {
    for (const form of tgt.forms) {
      const next = [];
      let spliced = false;
      for (const seg of segs) {
        if (seg.ref !== null || spliced) {
          next.push(seg);
          continue;
        }
        const idx = seg.text.toLowerCase().indexOf(form.toLowerCase());
        if (idx === -1) {
          next.push(seg);
          continue;
        }
        // only first occurrence
        next.push({ text: seg.text.slice(0, idx), ref: null });
        next.push({ text: seg.text.slice(idx, idx + form.length), ref: tgt.ri });
        next.push({ text: seg.text.slice(idx + form.length), ref: null });
        spliced = true;
      }
      segs = next;
      if (spliced) break; // one form per target is enough
    }
  }

  return (
    <p style={roleStyle}>
      {segs.map((s, k) =>
        s.ref !== null ? (
          <button
            key={k}
            onClick={(e) => {
              e.stopPropagation();
              onFollow(s.ref);
            }}
            style={{
              ...inlineRefStyle,
              color: TYPE_COLORS[mentions[s.ref].tipo] || "#57534e",
              textDecorationColor: TYPE_COLORS[mentions[s.ref].tipo] || "#57534e",
            }}
          >
            {s.text}
          </button>
        ) : (
          <span key={k}>{s.text}</span>
        )
      )}
    </p>
  );
}
