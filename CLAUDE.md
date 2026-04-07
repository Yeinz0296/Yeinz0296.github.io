# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Ragnarok Origin Classic simulation system** — a data and (eventually) tooling project for simulating character builds, feather optimization, and stat calculations for the game Ragnarok Origin Classic.

Currently the repo contains structured game data in CSV format. No build system or runtime is set up yet; the `.gitignore` is Node.js-flavored, suggesting that's the intended stack.

## Data Structure

All game data lives under `data/`. The current domain is the **Feather** system:

| File | Contents |
|------|----------|
| `data/feather/atk.csv` | Attack feathers: Space, Time, Day, Sky (Gold); Faith, Glory, Valor (Purple) |
| `data/feather/def.csv` | Defense feathers: Divine, Nature, Night, Terra (Gold); Soul, Mercy, Virtue (Purple) |
| `data/feather/mix.csv` | Mix feathers: Dark, Light (Gold); Order, Truth, Justice, Grace (Purple) |
| `data/feather/set_bonus.csv` | Set bonus combinations (nightingale → hawk_owl → eagle → raven tiers, for both atk/def statue types) |

### Feather CSV Schema

Each feather CSV uses `feather, rarity, tier` as the composite key. Columns vary by file but include stat fields like `patk_matk`, `pdef`, `mdef`, `max_hp`, `pve_dmg_bonus/reduction`, `pvp_dmg_bonus/reduction`, and upgrade cost columns (`feathers_to_next`, `eden_to_next`).

- **Gold rarity**: top-tier feathers, max tier is 7–10 depending on type
- **Purple rarity**: mid-tier feathers, can reach tier 20
- Empty cells in CSVs mean that stat is not provided by that feather

### Set Bonus Schema (`set_bonus.csv`)

Columns: `tier, set_name, statue_type (atk/def), req_blue, req_purple, req_gold` — then stat bonus columns. The `raven_prestige` set has per-tier rows (1–9, then 20); all other sets only have a tier-20 row.
