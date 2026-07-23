# Figma ↔ Code Sync Contract

**Figma library:** [Sprout Design System](https://www.figma.com/design/XAB4MCp5V8WdayPlEDvLAE)
(file key `XAB4MCp5V8WdayPlEDvLAE`, RBA org, built 2026-07-21)

**Published team library key:** `lk-ca4b9f36212696a42e787ef3c66690f1ac642ea98df4fe4a7a7e4e8d988ec7f7172aec323e74bac3521c31d992125772a7a6d7f89c1ceb88ce48fc090aefbd7b`
(published 2026-07-22 — subscribe to it from any other RBA file via Assets → team libraries)

**Sync model: code-first.** `styles.css` is the source of truth for token *values*.
The Figma file mirrors it with Variables; every variable carries WEB code syntax
(`var(--brand)`, `var(--padding-lg)`, …) matching the exact CSS custom property name.
Neither side updates automatically — drift is caught by the audit below.

## What maps to what

| Code (`styles.css`) | Figma |
|---|---|
| `:root` color ramps (`--green-*`, `--neutral-*`, secondary palette) | **Primitives** collection (1 mode, hidden from pickers) |
| Semantic colors (`--bg`, `--surface*`, `--text*`, `--border*`, `--brand*`, accents) | **Color** collection, Light mode |
| `[data-theme="dark"]` repoints | **Color** collection, Dark mode |
| `--padding-*`, `--spacing-*`, `--layout-*`, `--space-1…10` | **Spacing** collection (aliases preserved) |
| `--corner-radius-*`, `--radius-*` | **Radius** collection (aliases preserved) |
| `--font-display/sans/micro` | **Typography** collection (STRING) |
| `.type-*` classes | Text styles (Display/Serif 8xl … Caption Bold) |
| `--shadow-sm/md/lg` | Effect styles Shadow/sm/md/lg |
| `<span class="material-symbols-rounded">ligature</span>` | TEXT node in **Material Symbols Rounded**, `characters` = the same ligature, layer named after it |
| `.component .material-symbols-rounded { font-size: N }` | That icon node's `fontSize` = N |
| CSS `transform: rotate(Ndeg)` on an icon state | Icon node `rotation` = N, **same base glyph as code** |
| `<symbol id="cargill-logo">` in `index.html` + `.cargill-logo--*` modifiers | **Cargill logo** component set, one variant per modifier |
| `<symbol id="cargill-leaf-device">` in `index.html` (from `assets/cargill-leaf.svg`) + `--leaf-device-fill` | **Leaf graphic device** component set (Logo page), one variant per colorway |

The Figma pages panel is grouped to mirror the site's own left-nav structure —
Cover → Foundations (Color, Typography, Layout & shape, Logo) → System (Elevation) →
Components → Forms & inputs / Layout & content / Navigation & feedback, each internally
ordered to match that site page's sidebar. Figma has no plugin-API-exposed nested page
groups, so section headers are plain pages named `─── Section ───` (0 content nodes) —
the same convention the file already used for "Foundations"/"Components" before this
pass. The site's Foundations group also lists "Iconography" and its System group lists
"Themes" — neither has a dedicated Figma page (icons live inline per-component; themes
are Color-collection modes), so those two sub-items have no Figma counterpart to slot in.

The logo is not a redrawn or re-traced copy — the Figma vectors were imported from the
exact same path data the site renders, so the two cannot drift in shape. Only the fills
differ per variant, and the ones the CSS expresses as `var()` (`green-900`,
`soft-green-400`) are bound to those Figma variables; the ones the CSS hard-codes
(`#000`, `#fff`, `#00843D`) stay literal, matching the code.

Icons are real Material Symbols Rounded ligatures, not Unicode look-alikes — the layer
name, the glyph, and the font size all match the CSS rule for that component, so an icon
can be read straight off the Figma layer and typed into the markup. Where the code renders
one glyph and rotates it by state (accordion + combobox `expand_more` at 180°, tree toggle
`chevron_right` at 90°), Figma stores the **unrotated glyph name** and applies rotation, so
the layer name still tells you what to type.

Known intentional divergences:
- Some characters are **literal text in the CSS, not icons**, and must stay as typed
  characters in Figma: the Number input's `−` / `+`, the Breadcrumb separator `/`, and the
  required-field `*` on Label. A future icon sweep must not convert these.
- Empty state ships `folder` in Figma, but the site shows `folder`, `inbox`, and
  `search_off` across three examples. The icon is meant to be swapped per use.
- CSS dark mode repoints *primitives* (`--neutral-10` etc.) as a mechanism; Figma keeps
  primitives single-mode and puts dark values on the semantic layer. Rendered values match.
- Figma has 10 `dark/*` primitives with **no code syntax** — they exist in code only as
  raw hexes in the dark block. The audit must not flag them.
- Fonts: BigCaslonForCargill / HelveticaNow are licensed and not installed in the RBA
  Figma org. Stand-ins: **EB Garamond** for the serif, **Inter** for the sans (noted in
  every text style description). Swap when the real fonts are installed org-wide.

## The drift audit (run any time, e.g. before a release)

Ask Claude Code:

> Audit the Sprout Figma library (file key XAB4MCp5V8WdayPlEDvLAE) against the
> `:root` and `[data-theme="dark"]` blocks in styles.css per FIGMA-SYNC.md.
> Report every value, name, or scope that differs.

Mechanics: Claude reads all variables via the Figma MCP (`use_figma` read-only script
returning name → resolved value per mode → code syntax), parses the CSS token blocks,
and diffs by the code-syntax name. Anything added/changed on either side shows up.

## Versioning

**One version string, bumped together, every time either surface changes.**
There's no automatic bridge between this git repo and Figma — no webhook, no CI —
so the sync is a manual discipline with exactly two places to touch:

| Surface | Location |
|---|---|
| Site | `SPROUT_VERSION` constant in `app.js` (drives every `.js-version` span across all 5 pages) |
| Figma | The version line text node on the **Cover** page (node `3:14` as of this writing — re-find by content if the node ID has since changed) |

**Rule:** any time you make a change — to `styles.css`, to the HTML, or directly in
Figma — bump `SPROUT_VERSION` by one increment (`1.1` → `1.2` …) and update the Cover
node to the *identical* version string, in the same sitting. Never let one move without
the other. The Cover text also carries a short scope note and an updated date — refresh
those too so the string stays honest (e.g. `v1.2 · Full component library (50/50) ·
Updated 2026-08-03 · code-first sync`).

This is deliberately not date-based (calendar versioning wouldn't change on a second
same-day edit) and deliberately not tied to git commit count (Figma has no way to read
that). A plain incrementing counter, moved by hand in both places, is the simplest thing
that can't drift silently — if you ever see the site and Cover page disagree, the more
recently edited one is correct and the other is stale.

## Change workflow

- **Token value changes** → edit `styles.css` first, then update the Figma variable
  (or ask Claude to push the delta). Re-run the audit to confirm zero drift.
- **New tokens** → add to `styles.css`, then create the variable with scope + code
  syntax per the table above.
- **Figma-side experiments** are fine, but they are not real until they land in
  `styles.css`.
- **After any Figma-side edit** (new/changed variable, style, or page), republish the
  library (Assets panel → Publish) so subscribed files pick up the change — edits sit
  as local, unpublished changes until then.
