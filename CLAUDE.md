# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A **Ragnarok Origin Classic (ROOC) Valkyrie Feather Planner** — a single-page web tool for planning feather builds, calculating upgrade costs, tracking stat targets, and viewing set bonuses. Targeted at a friend group, hosted on GitHub Pages.

Future tabs planned: Stats, Skill, Equipment. The feather planner is the current focus.

## Tech Stack

- **No build system.** Single `index.html` + `js/app.js`. Push to GitHub Pages and it works.
- **Tailwind CSS** via CDN (`https://cdn.tailwindcss.com`)
- **PapaParse** via CDN for CSV parsing
- **Font Awesome** via CDN for icons
- **Google Fonts** (Quicksand) for typography
- When the project grows, planned migration to Next.js

## Architecture

### Files
- `index.html` — All markup, CSS custom properties, inline `<style>`, and `<script src="js/app.js">`
- `js/app.js` — All application logic
- `data/feather/` — CSV data (loaded at runtime via `fetch` + PapaParse)
- `data/support me/Touch n Go QR.png` — Support tab QR image

### State (`js/app.js`)

Single `state` object is the source of truth:
```js
state.data        // loaded CSVs: feathers.atk[], feathers.def[], feathers.mix[], setBonuses[], presets[]
state.sets        // set names by type; state.sets.order is the paired ATK/DEF display order
state.unlockedSets // { atk: ['Duel'], def: ['Wisdom'] } — defaults to 1 unlocked each
state.build       // { [setName]: [{feather, tier}, ...5 slots] }
state.inventory   // feather duplicate counts for cost tracking
state.baseStats   // { str/agi/vit/int/dex/luk: { base, bonus } }
state.manualStats // flat { [statKey]: value } for stats not derived from base stats
state.currentPreset / state.currentMode  // 'none'|presetName, 'pve'|'pvp'
```

`STAT_NAMES` maps CSV column keys (e.g. `patk_matk`, `pve_dmg_bonus`) to display names (e.g. `PATK/MATK`, `PvE DMG Bonus`).

### Game Rules (critical for logic)
- **10 sets total**: 5 ATK (Duel, Rune, Weapon, Intimidation, Omni) + 5 DEF (Wisdom, Fortitude, Mist, Relic, Conqueror)
- **Each set has 5 independent slots**
- ATK sets accept ATK or MIX feathers only; DEF sets accept DEF or MIX feathers
- The same feather type **can** appear in different sets, but **not twice within one set**
- Blue feathers are never used — dismantle fodder only
- Set bonus tier = **minimum feather tier** across all 5 slots in that set
- Each set independently detects its own set bonus

### Data Rules
- Default target tier: **T7** (warn visually if tier > T7)
- Gold feathers: T1–T7 confirmed; Purple: T1–T20 confirmed
- `Order` and `Truth` mix purple: only T1–T2 confirmed — show warning if selected
- Set bonuses: `raven_prestige` fully confirmed T1–T9 (has per-tier rows); all other sets T20 only (interpolate and mark as estimated)

### CSS Design System
Custom properties on `:root` in `index.html`:
- `--ro-bg` (#0f172a), `--ro-window-bg` (#1e293b), `--ro-border` (#334155)
- `--ro-gold` (#f6e05e), `--ro-purple` (#b794f4), `--ro-accent` (#f6ad55)
- `--ro-red` (#fc8181), `--ro-green` (#68d391), `--ro-blue` (#4299e1)
- Component classes: `.ro-window`, `.ro-header`, `.ro-tab`, `.ro-slot`, `.ro-slot-gold`, `.ro-slot-purple`
- ATK sets use red left border (`.ro-window-atk`); DEF sets use blue (`.ro-window-def`)
