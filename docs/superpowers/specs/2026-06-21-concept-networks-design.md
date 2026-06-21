# Spec: Wider concept networks for the Mention Explorer

**Date:** 2026-06-21
**Branch:** `feat/concept-networks` (off frozen tag `v1-threading`)
**Status:** Approved design

## Problem

The current explorer (`v1-threading`) links mentions only by **outgoing** edges:
`buildLinks` scans each mention's *own* role text for the names of other
mentions. The relationship is therefore one-directional.

Concrete gap: open the ART **"Paradosso della libertà. Il teatro politico di
Sartre"**. Its role text names Barbara Chitussi and Sartre, so those are its
only connections. But the ORG **Cronopio**'s role text says it is the
*publisher* of that saggio — an edge that today appears only on Cronopio's
card, never on the saggio's. The user wants each card to reconstruct the
wider network: who it names **and** who names it, plus one hop further.

## Goal

For every mention, surface its **direct bidirectional** connections:

1. **Direct outgoing** — mentions this one names (`menziona →`). Unchanged basis.
2. **Direct incoming** — mentions that name this one (`menzionato da ←`). New.

No data-format changes. Same accent-insensitive string matching as today, just
made bidirectional.

> **Scope note (revised):** an earlier draft of this spec also included a
> second-degree ("a due passi") tier. It was implemented and reviewed but cut
> as too noisy — through hub mentions (e.g. Sartre, named by ~30/33) almost the
> whole article is reachable at two hops, which buried the meaningful direct
> edges. We keep only the direct bidirectional links.

## Data layer — `mention-links.js`

Keep `strip`, `variants`, `buildLinks` (outgoing only) — `buildLinks` still
feeds the inline links inside role text via `Role.jsx`.

Add `buildNetwork(mentions)` returning, per **original** mention index:

```
{
  out: number[],   // outgoing (= buildLinks[i])
  in:  number[],   // incoming, minus any already in `out`
}
```

Algorithm:

- `out = buildLinks(mentions)`.
- `incoming[j]` = inverse of `out` (j collects every i whose `out` contains j).
- `in[i]` = `incoming[i]` filtered to drop indices already in `out[i]` (a mutual
  edge shows once, under "menziona").

## Presentation — new `Connections.jsx`

Extracted from `MentionRow` to keep each file focused. Props:
`{ net, mentions, onFollow }`. Renders **Connessioni dirette** — a labelled
chip row only when non-empty:

- `menziona →` — chips for `net.out`.
- `← menzionato da` — chips for `net.in`.

Every chip calls `onFollow(targetOriginalIdx)` → existing expand +
smooth-scroll + flash, working across both views and all category groups. Chip
colour = target's `TYPE_COLORS`.

## Wiring — `MentionRow.jsx` and `mention-explorer.jsx`

- `MentionRow` drops its inline chip row and renders
  `<Connections net={net} mentions={mentions} onFollow={onFollow} />` after the
  `<Role>` block. It receives a new `net` prop; `Role` keeps receiving
  `refs={net.out}` for inline links. Flash/descriptor/menzione behaviour
  unchanged.
- `mention-explorer.jsx`: replace
  `links = useMemo(() => buildLinks(article.mentions), …)` with
  `network = useMemo(() => buildNetwork(article.mentions), …)`. Pass
  `net={network[idx]}` to each `MentionRow`. `follow()`, the article switcher,
  the globale/categoria toggle, and original-index identity are all unchanged.

## Matching precision fix — `variants`

Making edges bidirectional exposed a latent false-positive in il-filo's
`variants`: it reduced any name to its last capitalised word as a "surname", so
the ART title "Paradosso… di Sartre" gained the variant `sartre` and matched
every role text that merely names Sartre (~28 false incoming edges). Fix:
`variants(name, tipo)` only derives the surname form for person-like types
(`PER`, `CHR`); other types match on their full name. After the fix Paradosso's
`menzionato da` is just Cronopio (which quotes the full title), while the
*person* Sartre keeps its rich incoming set.

## Out of scope

- No second-degree, third-degree, or full graph view. `follow()` already lets
  the reader walk the graph hop by hop.
- No relationship-type inference (author-of, publisher-of). Edges remain
  name-in-role-text matches; only direction is added.

## Verification

1. `npm run build` succeeds.
2. Open the saggio "Paradosso…" (Sartre article): **← menzionato da** lists
   Cronopio (the mention whose role names the saggio by its full title).
3. Direct rows split cleanly into **menziona →** / **← menzionato da**; mutual
   edges are not duplicated across the two.
4. A chip expands + smooth-scrolls + flashes the target; verify a cross-category
   jump in "Per categoria" mode.
```

