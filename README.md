# Sprout Design System

A working design-system styleguide for Cargill Sprout — foundations, system-level tokens, and 48 components, split across a few pages so each stays a reasonable size.

## Navigation vs. files

The sidebar groups the system into three conceptual sections; the HTML files are a separate, physical split. A nav group can draw sections from more than one file.

| Nav group | Contents |
|---|---|
| **System foundations** | 01 Color · 02 Typography · 03 Layout & shape · 04 Themes · 05 Elevation |
| **Product system** | 06 Iconography · 07 Data visualization · the three component groups |
| **Brand expression** | 08 Logo · 09 Graphic language · 10 Illustration & diagrams · 11 Approved assets |

| File | Holds |
|---|---|
| `index.html` | Home, Color, Typography, Layout & shape, Iconography, Logo |
| `system.html` | Themes, Elevation, Graphic language, Illustration & diagrams, Data visualization |
| `assets.html` | Approved assets — the asset governance register |
| `forms.html` / `content.html` / `navigation.html` | Components, grouped by Forms & inputs / Layout & content / Navigation & feedback |
| `getting-started.html` | Onboarding |

Section numbers follow the sidebar's order, not each file's — `system.html` runs 04, 05, 07, 09, 10 because its sections belong to all three groups.

## Approved assets

`assets.html` is the register of what the brand's human-authored assets are, who owns them, where the masters live, and what a generative tool may and may not do with each one. It is deliberately **not** the asset library: a few representative examples per category, then a pointer to the source of truth.

The records are held as JSON in a `<script type="application/json" id="asset-registry">` block at the bottom of that page, and `app.js` renders the cards from it. **That JSON is the single source of truth** — to add a record or correct a field, edit the JSON, not the DOM. Fields recorded as `null` are genuinely unknown and render as an explicit "unset"; don't fill them with a plausible guess.

## Build

Static HTML/CSS/JS, no build step. Open `index.html` or view the hosted site via GitHub Pages. The sidebar is generated to the same shape on every page (see `app.js` for the scroll-spy, collapsible nav groups, and cross-page search); the search index is a hardcoded list in `app.js` and needs an entry whenever a section is added.
