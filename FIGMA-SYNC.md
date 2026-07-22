# Figma ↔ Code Sync Contract

**Figma library:** [Sprout Design System](https://www.figma.com/design/XAB4MCp5V8WdayPlEDvLAE)
(file key `XAB4MCp5V8WdayPlEDvLAE`, RBA org, built 2026-07-21)

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

Known intentional divergences:
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

## Change workflow

- **Token value changes** → edit `styles.css` first, then update the Figma variable
  (or ask Claude to push the delta). Re-run the audit to confirm zero drift.
- **New tokens** → add to `styles.css`, then create the variable with scope + code
  syntax per the table above.
- **Figma-side experiments** are fine, but they are not real until they land in
  `styles.css`.
