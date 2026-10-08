# Explore knowledge graph

Status: **integrated: replaces the Living Atlas at `/{lang}/explore/` (revision 4).** Revision 4 replaces the earlier timeline-first Living Atlas (the owner's decision); its code and tests were removed, and the old `/explore/graph/` prototype route no longer exists.

## 1. What the data can honestly show today

Inspected 2026-10-08 with `npm run artifacts:print` (the public artifact contract, not collections).

| Entity | Present? | Source |
|---|---|---|
| Project / series | **20 series** (7 with ≥ 2 posts, 13 with 1) | `series` frontmatter, language-independent id |
| Article | 49 `writing` | blog adapter |
| Library item | 44 `resource` | resources/picks adapters (never drawn in the map; searchable) |
| Concept ("learned / used / explained") | **none** | the contract has no `concept` kind and no `taught`/`used` relation |
| Declared relations | **1**: `informed` Autocage Workstation 구축기 01 → Secure Boot 글 | `informedBy` frontmatter |
| Topics on artifacts | 0 | `topics` is empty on every artifact |

Consequences, by design requirement:

- *Project → article* exists only as **series membership**. Series membership organises articles; it is drawn as a quiet grey rule and is never described as a learned/used relation.
- *Article → concept* **cannot be shown**. The prototype says so on every project and article ("이 기록에 연결된 개념 데이터는 아직 없습니다"). Nothing is inferred from tags, titles, categories, dates or proximity.
- *Article → article* is shown only where a declared relation exists (today: one edge).
- 51 records have no series (7 posts + 44 library items). They are not drawn as a cluster; they are reachable through search and the note "시리즈에 속하지 않은 글 7개와 자료 44개는 검색으로 찾을 수 있습니다."

## 2. Why the first prototype was discarded

The first attempt was a Three.js 3D scene of stacked layer planes, cluster discs and ~93 dots. It ran well (121 fps on a 120 Hz display, 31 draw calls, ~10 MB JS heap) but failed the real test: with one declared relation, a graph of 93 dots grouped by series is "a collection of grouped dots", not a knowledge graph; labels overlapped; perspective planes were decoration. The rendering technology was not the problem, the encoding was.

## 3. Technology evaluation

| | Three.js / WebGL (tried) | DOM + thin SVG (chosen) |
|---|---|---|
| Frame rate | 121 fps | not frame-bound: one render ≈ 1.1 ms median, 3.1 ms p95, 3.8 ms max (60 level changes, dev build) |
| JS shipped | three + client, tens of KB gzip | **3.9 KB gzip** client + 7 KB CSS |
| Titles | needed a label-collision layer; truncation | normal-flow DOM: full titles wrap, cannot overlap |
| Accessibility | canvas is opaque; needed a parallel list | real buttons, links, `aria-current`, focus order, live region |
| d3-force | needed | **not used**: layout is plain flow (below) |

Decision: three, d3-force and WebGPU are not used. The scale (tens to low hundreds of visible items, progressive disclosure) never needs a GPU. Revisit only if a single view must show thousands of simultaneous nodes, which progressive disclosure is designed to avoid.

## 4. Information structure (revision 3)

The default view is a global relationship map, and **every article is on it**; project cards are the secondary "목록" mode.

- **Two regions on one column grid.** Top: *only linked articles*, in project lanes, laid out as a layered DAG (an arrow always points from a lower column to a higher one). Below, under "연결 없는 글 N개": *every other article*, still grouped by project lane, as a grid of the same compact cards. Connected work therefore sits together and arrows stay short; a growing pile of unlinked articles never pushes connected ones apart. Library items without a link are one collapsed line (they are not articles).
- **Lanes.** A project (series) gets a lane when it has ≥ 2 articles or takes part in a link. Single-article series and articles without a series share one quiet "그 외" lane (the series name stays on the card).
- **Arrows only.** Edges carry no text. The only annotation is the arrowhead at the target card's border. The Detail panel lists a record's links as `A → B`, always from → to as stored, with no verbs and no "origin/target" captions. (Filter chips, shown only when ≥ 2 link types exist, are type names, not edge labels.)
- **Focus.** Select a card: it and its direct neighbours are emphasised, edges of the selection are accent, the rest dims (only when the selection has links; an unlinked card is just outlined).
- **Detail** (below the map, only when something is selected): full title, date, description, source (project, original link/host), links.
- **URL / Back.** `?focus=<id>`, `?view=list&project=…`; browser Back/Forward and `Esc` restore state; clearing the selection returns to the Overview.
- **Visual encoding (documented).** Accent outline = the card has a declared link; light outline = no declared link yet; dashed card = a collapsed project. Size and colour never indicate importance.

Search covers every record, drawn or not.

## 5. Layout choice: layered swimlanes (compared with force-directed and radial)

| | Force-directed | Radial / concentric | **Layered DAG in project swimlanes (chosen)** |
|---|---|---|---|
| Deterministic | only with fixed seeds; any data change reshuffles everything | yes | **yes** (no simulation) |
| Direction | not encoded; arrows must cross clutter | not encoded | **encoded by position**: an edge always runs from a lower column to a higher one |
| Node/label overlap | needs collision pass, still brittle for wrapped titles | brittle | **impossible by construction**: cards are measured, then stacked |
| Edge-through-node | common | common | **routed only through free channels** (the gap between adjacent columns, or the gap between lanes) |
| Project grouping | hulls/bubbles (the rejected look) | rings | **lane = project**, a quiet rule and label, no frame |
| Tiny graphs | scattered | scattered | one arrow between two cards |

Algorithm (`graph-client.ts`, no library): 1) group into display nodes; 2) longest-path rank per component (DFS back edges ignored so cycles cannot loop) = column; 3) lanes by earliest connected record, "no series" last; 4) cards created at the final width and measured, so heights are real; 5) cells (lane × column) stacked, larger components first, two barycentre sweeps to reduce crossings; 6) edges: adjacent columns = one S-curve inside the gap; longer edges = rounded orthogonal route through the lane gap. Every edge **starts on the source card's right border and ends on the target card's left border**; the arrowhead tip is the endpoint. The path is built only from the stored `from → to`, so selecting either end changes nothing about the geometry.

**Growth rules.** (a) Past 80 cards the busiest projects start collapsed into one dashed summary card each (click or 펼치기 expands; a selected record is never hidden in a collapsed project). (b) When every card is a collapsed project, ranks of an aggregated graph are meaningless, so the cards stack in one column and links become arcs in the right margin. (c) Past 10 links all of them stay on the map as thin grey lines without arrowheads; only the selection's links get accent colour and arrowheads, cards show their link count, and a note says so. (d) With ≥ 2 link types, filter chips appear. (e) Linked lanes are reordered by the barycentre of their partner lanes so linked projects sit next to each other.

Sizes (all articles are visible, so cards are compact): card width 100–200 px chosen so 4 columns fill the content width (≥ 900 px; 3 columns below, 2 on phones), title 13 px sans, meta 10 px mono, 8 px row gap, 44 px column gap (28 px on phones), 130 px lane gutter (on phones the lane name sits above its cards).

## 5b. Canvas (revision 4)

The vertical stack was too tall (the 49-article map was ~2800 px with a single column of lanes), so the board became a **fixed-size world on a pan/zoom canvas** (DOM cards inside a CSS-transformed container; no WebGL, text stays crisp and accessible).

- **World layout** (`src/utils/graph/board.ts`): region 1 = linked cards in project lanes (layered DAG, as before); region 2 = one block per project, three cards wide, packed shortest-column-first so the world is landscape (1672 × 1230 px for today's data).
- **Camera.** Drag to pan, wheel or pinch to zoom around the pointer, `+ − 전체 보기` buttons, keyboard `+ - 0` and arrows, focus-in on a card brings it into view. Zoom range = 0.7 × fit … 2.4.
- **Overview camera.** If the whole world fits at ≥ 0.62 zoom it is shown whole; otherwise the linked region is shown at a readable size with the rest of the canvas continuing below it (the relationships are the point). "전체 보기" always fits everything.
- **Semantic zoom.** `data-lod`: below 0.6 unlinked cards are plain boxes (their text would be unreadable) while project labels grow so they stay ~13 px on screen; 0.6–0.85 titles; above, dates too. Linked cards always show their text.
- **Focus.** Selecting a card animates the camera (280 ms) to frame it and its direct neighbours, leaving room for the detail panel, which now floats over the canvas (a bottom sheet on phones). Clearing the selection returns to the Overview camera. Camera state is not in the URL; `?focus=` restores selection and framing.
- **Tests.** `test/graph-board.test.mjs` runs the layout without a browser: no card overlaps, every edge starts on its source border and ends on its target border, no edge sample inside any card, output independent of input order, arcs for collapsed projects, and a smoke test over the real content (all 49 articles placed, the one declared link routed).

## 5c. Connected graph, wide workspace, floating inspector (revision 5)

Decisions that replace parts of 4, 5 and 5b (those sections describe how the page got here; this is what ships):

- **Only linked records are drawn.** The map holds exactly the records that take part in a declared link; nothing is added for a shared series, tag or category, so there are **no project lanes, no empty containers and no list of the unlinked records under the map**. Search and the 목록 view still reach every record (with no declared link at all the workspace is a short box with a plain note).
- **Layout** (`src/utils/graph/board.ts`, rewritten): each connected group is a layered DAG (longest-path columns, barycentre ordering, neighbour-pull vertical placement); an arrow crossing several columns passes through a reserved slot in every column it crosses, so it can never run through a card; arrows meeting one border are spread along it; an arrow that would point backwards (a cycle in the declared links) goes around underneath. Groups are packed into rows; the browser tries ~10 row widths and keeps the one that shows the whole graph largest in the workspace it has. The board is the tight bounding box of the cards (no padding, no lanes).
- **Controls inside the map, no frame.** There is no page title row (an `sr-only` h1 keeps the heading), no legend and no help text, and the canvas has no border, radius, shadow or own background: it is the page. The 관계 지도 | 목록 switch sits at the workspace's top left and the search (a magnifier and an underline, no box; same 2 rem height as the switch) at its right, both below the floating language button, the search's right edge on the zoom buttons' line; zoom (+ − 전체 보기) bottom right; the relation-type filter bottom left. An 84 px strip along the top (52 px on phones) is kept free of cards, and the inspector avoids the controls. The inspector's max height leaves that strip free, so it scrolls inside. The 목록 view fills the same space and scrolls. On phones the controls span the top, only 전체 보기 stays (bottom left; pinch zooms). Lists of posts are ascending by date.
- **Wide workspace.** The map uses `100% − 2 × clamp(12px, 2.2vw, 40px)` (max 2400 px) instead of the 980 px frame (`.kg-wide` in `graph.css`). The header and every other page keep their own width.
- **Initial camera.** Fit the connected graph's bounding box, centred, with 40 px (16 px on phones) padding, at most 0.875×. A graph that cannot fit at ≥ 0.5× starts at 0.5× from its top-left and is panned (readable beats complete). Workspace height follows the content (min 25 rem, max 80 % of the window, 820 px) instead of a big empty box. A resize refits only if the visitor has not moved the canvas; otherwise the camera keeps its centre. Reset (`전체 보기`, key `0`) clears the selection and refits.
- **Floating inspector** (`placeFloating()` in `src/utils/graph/place.ts`, pure and tested): a compact panel (full title, date, description, link to the post, relation rows `A → B`, project) sits beside the selected card, trying right, left, below, above and taking the first spot that covers no card. If there is none, the camera moves only as far as needed (pan first; zoom out only if the selection and its neighbours do not fit) so they sit on one side and the panel on the other; leaving the selection restores the camera, unless the visitor moved it meanwhile. A record without a card (reached through search or `?focus=`) takes a free corner. Esc, the × button, or a click outside (not a drag) closes it; opened from the keyboard, focus moves into it and returns to the card on close. At ≤ 820 px (phones and portrait tablets) it is a bottom sheet (≤ 52 % of the workspace), the camera framing the selection above it.
- **No redraw on selection.** The cards and edges are built once per change of the drawn set (filter, late web fonts that changed card heights); selecting only toggles classes and positions the panel.
- **Dev-only code** (`?bench` hook, invented graphs) lives in `graph-bench.ts`, a separate chunk fetched only with `?bench`.

### Verification (revision 5)

Real data: 2 linked articles (구축기 01 → Secure Boot), 91 records outside the map. Stress: `?bench&synthetic=N` invents N linked records in groups of 2–7 (chains, a branch, a long link, links between groups).

| Check | 1440×900 | 1280×720 | 768×1024 (sheet) | 390×844 (sheet) |
|---|---|---|---|---|
| Real data: whole graph inside the workspace at first paint | yes (1.75×) | yes (1.75×) | yes (1.48×) | yes (0.70×) |
| Real data, each card selected: panel covers selection / neighbour; either card clipped | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| 21 linked cards, every card selected in turn: panel inside workspace | 21/21 | 21/21 | 21/21 | 21/21 |
| … panel covers the selected card / a neighbour | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| … selected card clipped | 0 | 0 | 0 | 0 |
| … neighbours clipped (neighbourhood too wide to frame at a readable size) | 0 | 1 | 0 (zoomed to 0.32×) | 19 (kept readable) |
| Camera restored after closing | yes | yes | yes | yes |
| Page horizontal scroll | none | none | none | none |

`test/graph-board.test.mjs` adds a seeded random-graph property test (40 graphs of 6–45 nodes with long links, fans and cycles): no card overlap, every arrow starts on its source's right border and ends on its target's left border, no sampled point of any arrow inside a card, everything inside the board.

Production build served statically, Lighthouse 12 (mobile = simulated slow 4G, 4× CPU; median of 3 runs; desktop = 1 run), before = revision 4:

| | before | after |
|---|---|---|
| Performance mobile / desktop | 97 / 100 | 97 / 100 |
| Accessibility mobile | 96 (theme button + 3 lane toggles below the 24 px target size) | 100 for the map (the remaining finding is the header theme button) |
| FCP / LCP mobile | 2104 / 2255 ms | 1997 / 2103 ms |
| TBT mobile | 32 ms | 33 ms |
| CLS mobile / desktop | 0 / 0 | 0.011 (the collapsed list under the map moves when web fonts swap in) / 0 |
| Style & Layout, mobile (4× CPU) | 453 ms | 136 ms |
| DOM elements | 756 | 370 |
| Transfer | 681 KiB | 616 KiB (fewer Korean font subsets are fetched: 2 cards instead of 49 titles; the hidden page title is set in the sans stack so it does not pull the serif font in) |
| Explore JS (min / gzip) | 29.0 / 10.9 KB | 30.7 / 11.8 KB (+ 1.4 KB `?bench` chunk, not loaded normally) |
| Explore CSS (min / gzip) | 15.5 / 3.5 KB | 13.5 / 3.2 KB |

Interaction cost (in-page, desktop, unthrottled; select 30 cards three times, each followed by a forced layout): before 6.5 ms median / 11.2 ms p95 (every selection rebuilt 49 cards; 49 cards, 18 invented links) → after 1.2 ms / 2.1 ms (49 cards, 49 invented links). Applying a pan/zoom transform: 0.02–0.04 ms. `layoutBoard()` including the row-width search: 7.7 ms for 60 nodes, 33 ms for 250 (Node, warm).

Remaining limits: a connected group too large for the workspace shows at 0.5× from its top-left and is panned; very wide neighbourhoods on small screens are not framed together (the selection is framed alone, neighbours are a pan away); a long chain makes a wide board (one column per step); while panning or zooming the open inspector stays where it was placed; on touch, one finger pans the canvas (page scroll continues from the controls and the text around the map); no screen-reader, Safari or Firefox pass yet.

## 5a. Verification (revision 3)

Geometry read from the DOM/SVG after settling: every card's box and 41 sampled points per path. Real data = 49 articles, 1 declared link.

| Check | 1280 | 768 | 390 |
|---|---|---|---|
| Articles drawn | 49 | 49 | 49 |
| Card overlaps | 0 | 0 | 0 |
| Clipped titles | 0 | 0 | 0 |
| Arrow starts on source border, ends on target border | yes | yes | yes |
| Path samples inside a card | 0 | 0 | 0 |
| Edge labels in DOM | 0 | 0 | 0 |
| Page horizontal scroll | none | none | none |
| Card width / columns | 171 px / 4 | 148 px / 3 | 157 px / 2 |

The path `d` is byte-identical with nothing selected, with 구축기 01 selected and with Secure Boot selected. The pair appears in the first viewport, no click needed.

Synthetic (`?bench&synthetic=articles`, never shipped): all 49 real articles with 18 invented links between articles close in time. 0 overlaps, 0 violating edges; being past 10 links, the map shows all links as grey lines, cards show "연결 N", and selecting a card colours its 3 links and highlights its 3 neighbours. Known limits: the swimlane stack makes cross-project links long vertical lines (the grey fallback and lane reordering mitigate this); the synthetic map is ~2800 px tall; no screen-reader or Safari/Firefox pass yet.

## 6. Proposed schema extension (not implemented — needs owner approval)

To show *what I learned or used*, the contract needs concepts. Proposal:

1. **New artifact kind `concept`** (point-in-time = first appearance; `domain: learn`). Source of truth: the existing `topics` collection, which already has a hierarchy (`parent`) — e.g. *Linux → Boot → UEFI → Secure Boot* — plus lifecycle (aliases, merge) and is validated by `taxonomy:validate`. A concept is a topic that a post chooses to *teach* or *use*; unreferenced topics are not published.
2. **Two new relation types**, both `declared`, declared on the later artifact (the post):
   - `taught` (writing/review → concept): the post explains it.
   - `used` (project/writing/experiment → concept): the work applies it.
   Frontmatter, validated like `papers`: `teaches: [topic-id]`, `uses: [topic-id]`.
3. Relation verbs in `ui.ts` (`explore.rel.taught.out/in`, `used`), kind label `explore.kind.concept`, and the artifact/relation registries + JSON schema (the drift check enforces both).
4. No inference, ever: no concept or edge is created from tags, categories or titles.

Example, in the owner's words: Linux server setup → *taught* → Bootloader, UEFI, Secure Boot → *used* → GRUB.

## 7. Before integrating

- Owner review of the prototype (overview wording, whether series with a single post deserve entry points, how the rail should behave).
- Decide on the concept schema above; without it the map shows projects and posts only.
- Then: link from Explore (not replace it), keep the timeline view reachable (time metadata is untouched in the contract; a dated list view is a small follow-up), add `/explore/graph/` to `routes:validate`, and decide on sitemap (currently noindex).
