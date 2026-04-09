---
name: new-class-preset
description: Add a new class preset to data/feather/class_presets.csv. Guides through class name, PvE/PvP/both mode, priority stats, hidden stats, and optimal feather loadout, then appends correctly-formatted rows.
disable-model-invocation: true
---

The user wants to add a new class preset to the feather planner.

## Step 1: Gather class info

Ask for:
1. **class_id** — a short snake_case identifier (e.g. `wizard_pve`, `hunter_pvp`)
2. **mode** — `pve`, `pvp`, or `both`
3. **display_name** — shown in the UI (e.g. `Wizard (Glass Cannon)`)
4. **Priority stats** — comma-separated list of stat keys the class cares about most. Use these exact keys:
   - `vit`, `str`, `int`, `dex`, `agi`, `luk`
   - `patk_matk`, `pdef`, `mdef`, `max_hp`
   - `pve_dmg_bonus`, `pve_dmg_reduction`, `pvp_dmg_bonus`, `pvp_dmg_reduction`
   - `ignore_pdef`, `ignore_mdef`
5. **Hidden stats** — stats that provide zero benefit for this class (will be hidden in the UI)
6. **Optimal ATK feathers** — exactly 5 feather names (from ATK or MIX pool), comma-separated
7. **Optimal DEF feathers** — exactly 5 feather names (from DEF or MIX pool), comma-separated

## ATK Feather Pool
Gold: Space, Time, Day, Sky
Purple: Faith, Glory, Valor
MIX Gold: Dark, Light
MIX Purple: Order, Truth, Justice, Grace

## DEF Feather Pool
Gold: Divine, Nature, Night, Terra
Purple: Soul, Mercy, Virtue
MIX Gold: Dark, Light
MIX Purple: Order, Truth, Justice, Grace

## Rules
- ATK sets accept ATK or MIX feathers only
- DEF sets accept DEF or MIX feathers only
- The same feather CAN appear in both optimal_atk_feathers and optimal_def_feathers
- The same feather CANNOT appear twice in the same list

## CSV Format

Header: `class_id,mode,display_name,priority_stats,hidden_stats,optimal_atk_feathers,optimal_def_feathers`

Multi-value fields (priority_stats, hidden_stats, feather lists) are stored as quoted comma-separated strings within the CSV field:
`paladin_sac,pve,Paladin (Sacrifice Tank),"vit,ignore_pdef,pve_dmg_bonus,pve_dmg_reduction,max_hp,pdef,mdef","str,patk,patk_matk,int,dex","Time,Day,Sky,Grace,Glory","Nature,Night,Terra,Virtue,Soul"`

## Step 2: Write the rows

If mode is `pve` or `pvp` only, write one row.
If mode is `both`, ask whether to also add separate `pve` and `pvp` variant rows with different optimal loadouts (like the paladin preset does), or just one `both` row.

Show the user the exact row(s) before appending.

## Step 3: Verify app integration

After saving, remind the user:
- The app loads presets from `data/feather/class_presets.csv` at runtime via PapaParse
- Check `js/app.js` `state.currentPreset` logic to confirm the new `class_id` is handled correctly in any preset-specific UI filtering
