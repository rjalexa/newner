import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import rawArticles from "./articles.jsonl?raw";

// --- Data: loaded from articles.jsonl (one JSON object per line). ---
// Edit that file to add or change articles; the dev server hot-reloads.

/**
 * Parse JSONL text into article objects, skipping blank or malformed lines
 * and any line missing a "mentions" array. Validating at this boundary keeps
 * the rest of the component free of defensive checks.
 *
 * @param {string} raw - Raw JSONL file contents.
 * @returns {Array<object>} Valid article objects, in file order.
 */
function parseArticles(raw) {
  const articles = [];
  const lines = raw.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (err) {
      console.warn(`articles.jsonl: skipping malformed line ${i + 1}:`, err);
      continue;
    }
    if (!parsed || !Array.isArray(parsed.mentions)) {
      console.warn(`articles.jsonl: skipping line ${i + 1}: missing "mentions" array`);
      continue;
    }
    articles.push(parsed);
  }
  return articles;
}

const ARTICLES = parseArticles(rawArticles);

const TYPE_LABELS = { PER: "Persona", LOC: "Luogo", ORG: "Organizzazione", EVT: "Evento", ART: "Opera/Oggetto", CHR: "Personaggio" };
const TYPE_COLORS = {
  PER: "#c2410c", LOC: "#0e7490", ORG: "#6d28d9", EVT: "#b45309", ART: "#15803d", CHR: "#be185d",
};

function MentionRow({ m, rank, score }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #e7e2d6" }}>
      <button
        onClick={() => setOpen((o) => !o)}
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
        <span style={{
          flexShrink: 0, fontVariantNumeric: "tabular-nums", fontSize: 13,
          color: "#78716c", minWidth: 88, textAlign: "right",
        }}>
          salienza: <strong style={{ color: "#1c1917" }}>{score}</strong>
        </span>
        {open
          ? <ChevronDown size={16} color="#a8a29e" />
          : <ChevronRight size={16} color="#a8a29e" />}
      </button>
      {open && (
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
            <span style={meta}>Ruolo nell'articolo</span> {m.ruolo_articolo}
          </div>
        </div>
      )}
    </div>
  );
}

const meta = {
  display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
  textTransform: "uppercase", color: "#a8a29e", marginBottom: 2,
};

function titleFromSlug(slug) {
  return slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export default function App() {
  const [articleIdx, setArticleIdx] = useState(0);
  const [mode, setMode] = useState("globale"); // "globale" | "categoria"

  const article = ARTICLES[articleIdx];

  const grouped = useMemo(() => {
    if (!article) return [];
    if (mode === "globale") {
      const sorted = [...article.mentions].sort((a, b) => a.rilevanza_globale - b.rilevanza_globale);
      return [{ key: "all", label: null, items: sorted }];
    }
    const byType = {};
    for (const m of article.mentions) (byType[m.tipo] ||= []).push(m);
    return Object.keys(byType)
      .sort()
      .map((tipo) => ({
        key: tipo,
        label: TYPE_LABELS[tipo] || tipo,
        items: byType[tipo].sort((a, b) => a.rilevanza_categoria - b.rilevanza_categoria),
      }));
  }, [article, mode]);

  if (!article) {
    return (
      <div style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        maxWidth: 760, margin: "0 auto", padding: "32px 20px",
        color: "#1c1917", background: "#faf8f3", minHeight: "100vh",
      }}>
        <p style={{ fontSize: 14, color: "#78716c", lineHeight: 1.5 }}>
          Nessun articolo da mostrare. Controlla che <code>articles.jsonl</code> contenga
          almeno una riga JSON valida con un array <code>mentions</code>.
        </p>
      </div>
    );
  }

  const articleUrl = article.url || `https://ilmanifesto.it/${article.slug}`;

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      maxWidth: 760, margin: "0 auto", padding: "32px 20px",
      color: "#1c1917", background: "#faf8f3", minHeight: "100vh",
    }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#b45309", marginBottom: 6 }}>
          Mention Explorer · MVP
        </div>
        <h1 style={{
          fontFamily: "Georgia, serif", fontSize: 26, lineHeight: 1.2,
          margin: "0 0 6px", fontWeight: 700,
        }}>
          <a
            href={articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "none", borderBottom: "2px solid #b45309" }}
          >
            {titleFromSlug(article.slug)}
          </a>
        </h1>
        <div style={{ fontSize: 13, color: "#78716c", fontVariantNumeric: "tabular-nums" }}>
          {article.articledate} · {article.mentions.length} menzioni · {article.articleid}
        </div>
      </header>

      <select
        value={articleIdx}
        onChange={(e) => setArticleIdx(Number(e.target.value))}
        style={{ marginBottom: 16, padding: "8px 10px", fontSize: 14, borderRadius: 6, border: "1px solid #d6d3cb", background: "#fff", width: "100%" }}
      >
        {ARTICLES.map((a, i) => <option key={a.articleid} value={i}>{titleFromSlug(a.slug)}</option>)}
      </select>

      <div style={{ display: "inline-flex", background: "#efece3", borderRadius: 8, padding: 3, marginBottom: 20 }}>
        {[["globale", "Ranking globale"], ["categoria", "Per categoria"]].map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => setMode(val)}
            style={{
              padding: "7px 16px", border: "none", borderRadius: 6, cursor: "pointer",
              fontSize: 13, fontWeight: 600, fontFamily: "inherit",
              background: mode === val ? "#fff" : "transparent",
              color: mode === val ? "#1c1917" : "#78716c",
              boxShadow: mode === val ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
            }}
          >{lbl}</button>
        ))}
      </div>

      {grouped.map((group) => (
        <section key={group.key} style={{ marginBottom: group.label ? 22 : 0 }}>
          {group.label && (
            <h2 style={{
              fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
              color: TYPE_COLORS[group.key] || "#57534e", margin: "0 0 4px",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {group.label}
              <span style={{ color: "#a8a29e", fontWeight: 500 }}>({group.items.length})</span>
            </h2>
          )}
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e7e2d6", padding: "0 12px" }}>
            {group.items.map((m, i) => (
              <MentionRow
                key={m.stringa_ricerca + i}
                m={m}
                rank={mode === "globale" ? m.rilevanza_globale : m.rilevanza_categoria}
                score={m.salienza_finale.toFixed(2)}
              />
            ))}
          </div>
        </section>
      ))}

      <p style={{ fontSize: 12, color: "#a8a29e", marginTop: 24, lineHeight: 1.5 }}>
        Tocca una riga per descrittore, menzione originale e ruolo. Il titolo rimanda
        all'articolo su ilmanifesto.it. Aggiungi righe al file <code>articles.jsonl</code> per
        esplorare più articoli.
      </p>
    </div>
  );
}
