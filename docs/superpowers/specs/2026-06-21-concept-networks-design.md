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

For every mention, surface:

1. **Direct outgoing** — mentions this one names (`menziona →`). Unchanged basis.
2. **Direct incoming** — mentions that name this one (`menzionato da ←`). New.
3. **Second-degree** — distinct mentions reachable through a direct neighbour
   (`a due passi`), each tagged with the intermediary (`via …`), collapsed by
   default and capped.

No data-format changes. Same accent-insensitive string matching as today, just
made bidirectional and extended one hop.

## Data layer — `mention-links.js`

Keep `strip`, `variants`, `buildLinks` (outgoing only) — `buildLinks` still
feeds the inline links inside role text via `Role.jsx`.

Add `buildNetwork(mentions)` returning, per **original** mention index:

```
{
  out:    number[],                       // outgoing (= buildLinks[i])
  in:     number[],                       // incoming, minus any already in `out`
  second: Array<{ idx: number, via: number[] }>  // 2-hop, via sorted by rank
}
```

Algorithm:

- `out = buildLinks(mentions)`.
- `incoming[j]` = inverse of `out` (j collects every i whose `out` contains j).
- `in[i]` = `incoming[i]` filtered to drop indices already in `out[i]` (a mutual
  edge shows once, under "menziona").
- Direct neighbours of i = `out[i] ∪ in[i]`. Exclusion set for second-degree =
  direct neighbours ∪ `{i}`.
- For each direct neighbour `n`, take its direct neighbours
  (`out[n] ∪ incoming[n]`); any target `t` not in the exclusion set becomes a
  second-degree entry, accumulating `n` into `t`'s `via` set.
- `second` = distinct targets, each `via` array sorted by `rilevanza_globale`
  (best first), and the `second` array itself sorted by the target's
  `rilevanza_globale` (most relevant first).

Hub mentions (e.g. Sartre, named by ~31/33) are **not** suppressed — their
second-degree paths are kept but tamed by the cap + collapse in the UI.

## Constant — `mention-constants.js`

`export const SECOND_DEGREE_CAP = 8;` — max second-degree chips shown when the
tier is expanded; overflow is summarised as `+ altri K`.

## Presentation — new `Connections.jsx`

Extracted from `MentionRow` to keep each file focused. Props:
`{ net, mentions, onFollow }`.

- **Connessioni dirette** (render a labelled chip row only when non-empty):
  - `menziona →` — chips for `net.out`.
  - `menzionato da ←` — chips for `net.in`.
- **A due passi** (only when `net.second.length > 0`):
  - Collapsed toggle button `▸ A due passi ({net.second.length})`
    (`▾` when open). Local `useState(false)` — purely presentational, resets
    when the row unmounts.
  - When open: take the first `SECOND_DEGREE_CAP` entries; group them by their
    representative intermediary `via[0]`; render each group under a small
    `via <name>` subheading, chips ordered by rank. If
    `second.length > SECOND_DEGREE_CAP`, append `+ altri K`.
- Every chip calls `onFollow(targetOriginalIdx)` → existing expand +
  smooth-scroll + flash, working across both views and all category groups.
- Chip colour = target's `TYPE_COLORS`. Second-degree chips get a lighter,
  muted treatment so the direct tier stays primary.

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

## Out of scope

- No third-degree or full graph view. `follow()` already lets the reader walk
  the graph hop by hop.
- No relationship-type inference (author-of, publisher-of). Edges remain
  name-in-role-text matches; only direction and one extra hop are added.
- No suppression of hub mentions — handled by cap + collapse instead.

## Verification

1. `npm run build` succeeds.
2. Open the saggio "Paradosso…" (Sartre article): **menzionato da** now lists
   Cronopio (and other mentions whose role names the saggio).
3. **A due passi** is collapsed by default; expanding shows grouped `via …`
   chips, capped at 8 with `+ altri K` overflow.
4. A second-degree chip and a direct chip both expand + smooth-scroll + flash
   the target; verify a cross-category jump in "Per categoria" mode.
5. Mutual edges are not duplicated across `menziona` / `menzionato da`.
```

