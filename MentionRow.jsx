import { ChevronDown, ChevronRight } from "lucide-react";
import { TYPE_COLORS, TYPE_SOFT } from "./mention-constants.js";
import Role from "./Role.jsx";
import Connections from "./Connections.jsx";

// A single mention row: a tappable header (rank, type tag, name) and, when
// open, the descriptor, the original mention (only when it differs), and the
// role text rendered with inline cross-references plus connection chips.
//
// Controlled by App: open/flash state and the scroll ref are keyed by the
// mention's ORIGINAL index so cross-references resolve across both views.
// No salience figure is shown — importance is conveyed by rank order alone.

const meta = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "#a8a29e",
  marginBottom: 2,
};

/**
 * @param {object} props
 * @param {object} props.m - The mention.
 * @param {number} props.index - The mention's original index.
 * @param {number} props.rank - Display rank (rilevanza_globale or _categoria).
 * @param {boolean} props.isOpen - Whether the row is expanded.
 * @param {boolean} props.isFlash - Whether to show the brief flash highlight.
 * @param {{out: number[], in: number[]}} props.net - Connection network for this mention.
 * @param {Array<object>} props.mentions - All mentions (original order).
 * @param {(index: number) => void} props.onToggle - Toggle this row open/closed.
 * @param {(index: number) => void} props.onFollow - Follow a cross-reference.
 * @param {(el: HTMLElement | null) => void} props.cardRef - Ref callback for scrolling.
 */
export default function MentionRow({
  m,
  index,
  rank,
  isOpen,
  isFlash,
  net,
  mentions,
  onToggle,
  onFollow,
  cardRef,
}) {
  return (
    <div
      ref={cardRef}
      style={{
        borderBottom: "1px solid #e7e2d6",
        background: isFlash ? TYPE_SOFT[m.tipo] || "#efece3" : "transparent",
        transition: "background 0.4s ease",
        borderRadius: isFlash ? 6 : 0,
      }}
    >
      <button
        onClick={() => onToggle(index)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "12px 4px", background: "none", border: "none", cursor: "pointer",
          textAlign: "left", fontFamily: "inherit",
        }}
      >
        <span style={{
          flexShrink: 0, width: 30, textAlign: "right",
          fontVariantNumeric: "tabular-nums", fontWeight: 700,
          fontSize: 15, color: "#1c1917",
        }}>{rank}</span>
        <span style={{
          flexShrink: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", color: "#fff", background: TYPE_COLORS[m.tipo] || "#57534e",
          padding: "2px 7px", borderRadius: 3,
        }}>{m.tipo}</span>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 15, color: "#1c1917" }}>
          {m.stringa_ricerca}
        </span>
        {isOpen
          ? <ChevronDown size={16} color="#a8a29e" />
          : <ChevronRight size={16} color="#a8a29e" />}
      </button>
      {isOpen && (
        <div style={{ padding: "0 4px 16px 46px", fontSize: 14, lineHeight: 1.55, color: "#44403c" }}>
          {m.menzione_originale !== m.stringa_ricerca && (
            <div style={{ marginBottom: 8 }}>
              <span style={meta}>Menzione</span> “{m.menzione_originale}”
            </div>
          )}
          {m.descrittore && (
            <div style={{ marginBottom: 8 }}>
              <span style={meta}>Descrittore</span> {m.descrittore}
            </div>
          )}
          <div>
            <span style={meta}>Ruolo nell'articolo</span>
            <Role text={m.ruolo_articolo} refs={net.out} mentions={mentions} onFollow={onFollow} />
          </div>
          <Connections net={net} mentions={mentions} onFollow={onFollow} />
        </div>
      )}
    </div>
  );
}
