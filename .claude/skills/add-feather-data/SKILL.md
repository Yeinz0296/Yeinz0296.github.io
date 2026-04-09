---
name: add-feather-data
description: Add new feather tier rows to the correct CSV data file (atk.csv, def.csv, or mix.csv). Guides through providing feather name, rarity, tier, stats, and upgrade costs, then appends the correctly-formatted row matching the file's column order exactly.
disable-model-invocation: true
---

The user wants to add new feather data they've tested in-game.

## Step 1: Determine which file

Ask: "Which feather type? (ATK / DEF / MIX)"

- ATK feathers → `data/feather/atk.csv`
- DEF feathers → `data/feather/def.csv`
- MIX feathers → `data/feather/mix.csv`

## Step 2: Gather the data

Ask for:
- Feather name (e.g. Space, Time, Dark)
- Rarity (Gold or Purple — never Blue)
- Tier number
- All stat values for that tier (reference the header columns below)
- Upgrade cost: `feathers_to_next` and `eden_to_next` (leave blank if this is the max tier)

## Column Orders (must match exactly)

**atk.csv**: `feather,rarity,tier,patk_matk,ignore_pdef,ignore_mdef,pve_dmg_bonus,pvp_dmg_bonus,int,dex,str,feathers_to_next,eden_to_next`

**def.csv**: `feather,rarity,tier,max_hp,pdef,mdef,pve_dmg_reduction,pvp_dmg_reduction,vit,feathers_to_next,eden_to_next`

**mix.csv**: `feather,rarity,tier,max_hp,patk_matk,pdef,mdef,pve_dmg_reduction,pvp_dmg_bonus,pvp_dmg_reduction,pdmg_mdmg_reduction_percent,pdmg_mdmg_percent,feathers_to_next,eden_to_next`

## Step 3: Format the row

- Leave stat columns empty (not zero) if that feather doesn't provide that stat
- `eden_to_next` must be quoted and comma-formatted: `"72,000"` not `72000`
- Max-tier rows: leave `feathers_to_next` and `eden_to_next` blank
- The trailing comma at end of header row is acceptable — don't add one to data rows

## Step 4: Insert the row

Read the target CSV file first. Find the correct position — rows are grouped by feather name, then ordered by tier ascending. Insert the new row in the correct position (not just at the end).

Show the user the exact row you're about to add and ask for confirmation before writing.

## Step 5: Confirm data confidence

After writing, ask: "Is this confirmed in-game data, or estimated? If estimated, we should add a note to CLAUDE.md."
