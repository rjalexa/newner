import { useState, useMemo, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import rawArticles from "./articles.jsonl?raw";
import { TYPE_LABELS, TYPE_COLORS } from "./mention-constants.js";
import { buildNetwork } from "./mention-links.js";
import MentionRow from "./MentionRow.jsx";

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

function titleFromSlug(slug) {
  return slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
}

const switcherBtn = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 34, height: 34, borderRadius: "50%", cursor: "pointer",
  border: "1px solid #d6d3cb", background: "#fff", fontFamily: "inherit",
};

const GLOBAL_LIMIT = 5;
const CATEGORY_LIMIT = 3;

export default function App() {
  const [articleIdx, setArticleIdx] = useState(0);
  const [mode, setMode] = useState("globale"); // "globale" | "categoria"
  const [openIdx, setOpenIdx] = useState(null); // expanded mention (original index)
  const [flashIdx, setFlashIdx] = useState(null); // briefly highlighted mention
  const [globalExpanded, setGlobalExpanded] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const cardRefs = useRef({}); // original index -> DOM node, for scrolling

  const article = ARTICLES[articleIdx];

  // Connection network, indexed by original mention order so it resolves in
  // both views. Original indices keep open/flash/scroll stable across regroups.
  const network = useMemo(() => (article ? buildNetwork(article.mentions) : []), [article]);
  const indexOf = useMemo(() => {
    const map = new Map();
    if (article) article.mentions.forEach((m, i) => map.set(m, i));
    return map;
  }, [article]);

  const selectArticle = useCallback((idx) => {
    setArticleIdx(idx);
    setOpenIdx(null);
    setFlashIdx(null);
    setGlobalExpanded(false);
    setExpandedCategory(null);
  }, []);

  const changeArticle = useCallback(
    (delta) => selectArticle((articleIdx + delta + ARTICLES.length) % ARTICLES.length),
    [articleIdx, selectArticle]
  );

  const toggle = useCallback((idx) => {
    setOpenIdx((cur) => (cur === idx ? null : idx));
  }, []);

  const follow = useCallback((idx) => {
    setOpenIdx(idx);
    setFlashIdx(idx);
    setTimeout(() => setFlashIdx((cur) => (cur === idx ? null : cur)), 1200);
    const el = cardRefs.current[idx];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const grouped = useMemo(() => {
    if (!article) return [];
    if (mode === "globale") {
      const sorted = [...article.mentions].sort((a, b) => a.rilevanza_globale - b.rilevanza_globale);
      return [{ key: "all", label: null, items: sorted }];
    }
    // Group by type, ordering the groups by where each type FIRST appears in
    // the global ranking (not alphabetically): walk mentions in global-rank
    // order and record each type the first time it shows up.
    const globalOrder = [...article.mentions].sort((a, b) => a.rilevanza_globale - b.rilevanza_globale);
    const byType = {};
    const typeOrder = [];
    for (const m of globalOrder) {
      if (!byType[m.tipo]) {
        byType[m.tipo] = [];
        typeOrder.push(m.tipo);
      }
      byType[m.tipo].push(m);
    }
    return typeOrder.map((tipo) => ({
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

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
        marginBottom: 12,
      }}>
        <button
          onClick={() => changeArticle(-1)}
          aria-label="Articolo precedente"
          style={switcherBtn}
        >
          <ChevronLeft size={18} color="#44403c" />
        </button>
        <span style={{
          fontSize: 13, fontWeight: 600, color: "#57534e",
          fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em",
        }}>
          Articolo {articleIdx + 1} / {ARTICLES.length}
        </span>
        <button
          onClick={() => changeArticle(1)}
          aria-label="Articolo successivo"
          style={switcherBtn}
        >
          <ChevronRight size={18} color="#44403c" />
        </button>
      </div>

      <select
        value={articleIdx}
        onChange={(e) => selectArticle(Number(e.target.value))}
        style={{ marginBottom: 16, padding: "8px 10px", fontSize: 14, borderRadius: 6, border: "1px solid #d6d3cb", background: "#fff", width: "100%" }}
      >
        {ARTICLES.map((a, i) => <option key={a.articleid} value={i}>{titleFromSlug(a.slug)}</option>)}
      </select>

      <div style={{ display: "inline-flex", background: "#efece3", borderRadius: 8, padding: 3, marginBottom: 20 }}>
        {[["globale", "Ranking globale"], ["categoria", "Per categoria"]].map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => {
              setMode(val);
              setGlobalExpanded(false);
              setExpandedCategory(null);
            }}
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

      {grouped.map((group) => {
        const isCategoria = !!group.label;
        const limit = isCategoria ? CATEGORY_LIMIT : GLOBAL_LIMIT;
        const isExpanded = isCategoria
          ? expandedCategory === group.key
          : globalExpanded;
        const visibleItems = isExpanded ? group.items : group.items.slice(0, limit);
        const hiddenCount = group.items.length - limit;

        return (
          <section key={group.key} style={{ marginBottom: isCategoria ? 22 : 0 }}>
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
              {visibleItems.map((m) => {
                const idx = indexOf.get(m);
                return (
                  <MentionRow
                    key={idx}
                    m={m}
                    index={idx}
                    rank={mode === "globale" ? m.rilevanza_globale : m.rilevanza_categoria}
                    isOpen={openIdx === idx}
                    isFlash={flashIdx === idx}
                    net={network[idx]}
                    mentions={article.mentions}
                    onToggle={toggle}
                    onFollow={follow}
                    cardRef={(el) => { cardRefs.current[idx] = el; }}
                  />
                );
              })}
              {((!isExpanded && hiddenCount > 0) || isExpanded) && (
                <button
                  onClick={() => {
                    if (isCategoria) {
                      setExpandedCategory(isExpanded ? null : group.key);
                    } else {
                      setGlobalExpanded((v) => !v);
                    }
                  }}
                  style={{
                    display: "block", width: "100%", padding: "10px 4px",
                    border: "none", borderTop: "1px solid #e7e2d6",
                    background: "none", cursor: "pointer", textAlign: "center",
                    fontSize: 13, fontWeight: 600, color: "#b45309",
                    fontFamily: "inherit", letterSpacing: "0.01em",
                  }}
                >
                  {isExpanded ? "Mostra meno ↑" : `Altre ${hiddenCount} menzioni ›`}
                </button>
              )}
            </div>
          </section>
        );
      })}

      <p style={{ fontSize: 12, color: "#a8a29e", marginTop: 24, lineHeight: 1.5 }}>
        Tocca una riga per descrittore, menzione originale e ruolo. Dentro il ruolo, i nomi
        delle altre menzioni sono collegamenti: toccali — o tocca i riferimenti in fondo — per
        seguire il filo da una menzione all'altra. Il titolo rimanda all'articolo su
        ilmanifesto.it; le menzioni sono ordinate per rilevanza.
      </p>
    </div>
  );
}
