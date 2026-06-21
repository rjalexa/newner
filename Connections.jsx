import { TYPE_COLORS } from "./mention-constants.js";

// The bidirectional relationship network for one expanded mention: chips for
// what it names ("menziona →") and what names it ("menzionato da ←"). Every
// chip follows the link via onFollow(originalIdx), reusing the explorer's
// expand + smooth-scroll + flash behaviour.

const label = {
  display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
  textTransform: "uppercase", color: "#a8a29e", margin: "12px 0 6px",
};

const chipRow = { display: "flex", flexWrap: "wrap", gap: 6 };

const chipBase = {
  fontSize: 12, background: "#fff", border: "1px solid", borderRadius: 20,
  padding: "4px 10px", cursor: "pointer", fontFamily: "inherit",
};

function Chip({ idx, mentions, onFollow }) {
  const color = TYPE_COLORS[mentions[idx].tipo] || "#57534e";
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onFollow(idx); }}
      style={{ ...chipBase, color, borderColor: color }}
    >
      {mentions[idx].stringa_ricerca} ↗
    </button>
  );
}

/**
 * @param {object} props
 * @param {{out: number[], in: number[]}} props.net - Direct connections.
 * @param {Array<object>} props.mentions - All mentions (original order).
 * @param {(idx: number) => void} props.onFollow
 */
export default function Connections({ net, mentions, onFollow }) {
  if (net.out.length === 0 && net.in.length === 0) return null;

  return (
    <div>
      {net.out.length > 0 && (
        <div>
          <span style={label}>Menziona →</span>
          <div style={chipRow}>
            {net.out.map((idx) => (
              <Chip key={idx} idx={idx} mentions={mentions} onFollow={onFollow} />
            ))}
          </div>
        </div>
      )}

      {net.in.length > 0 && (
        <div>
          <span style={label}>← Menzionato da</span>
          <div style={chipRow}>
            {net.in.map((idx) => (
              <Chip key={idx} idx={idx} mentions={mentions} onFollow={onFollow} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
