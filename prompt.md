Help me make a website with multiple tab, Stats, Skill, Feather, Equipment etc, but for now we focus on feather
system first. It based on a current popular game called Ragnarok Online Origin Classic (ROOC)

For this first tab, we will do Valkyrie Feather Planner

Purpose

A planning tool for players to plan feather builds, calculate resource costs, see stat totals per tier, and track
progress toward stat targets. Targeted at a friend group, so it needs to be clean and easy to use — not just a personal
tool.

I already upload the feather data (That I test and research my own, due to the game still new, I on a very limited
resource of feathers to test and record higher tiers) @data/feather\\

atk.csv — ATK feathers with stats per tier (T1–T7 gold confirmed, T1–T20 purple confirmed)

def.csv — DEF feathers with stats per tier

mix.csv — MIX feathers (Order and Truth purple only T1–T2 confirmed, rest unknown)

set\_bonus.csv — Set bonus values per tier (Raven's Prestige T1–T9 confirmed, others T20 only)

System Structure (Critical)

There are 10 statue sets total: 5 ATK + 5 DEF

Set names: Duel, Rune, Weapon, Intimidation, Omni (ATK) — Wisdom, Fortitude, Mist, Relic, Conqueror (DEF)

Each set has 5 slots independently

ATK slots accept ATK or MIX feathers only

DEF slots accept DEF or MIX feathers only

The same feather type CAN be used across different sets (Time in Duel AND Rune)

The same feather type CANNOT be used twice within the same set

Each set independently detects its own set bonus based on its own rarity composition

Blue feathers excluded — dismantle fodder only, never used in builds

Core Features

Class presets — Paladin (Sacrifice Tank) and Bard/Minstrel (Support) with recommended loadouts (Other classes will add
later)

Set builder — configure each of the unlocked sets independently, pick feather + tier per slot

Set bonus detection — auto-detect active set bonus per set based on rarity composition, show correct bonus value for
that set's tier

Stat summary — total stats across all sets, filtered by class priority stats

Resource cost calculator — total duplicate feathers + Eden Coins to reach target tier per feather, broken down by
feather and rarity

Stat target tracker — user sets target values (e.g. PvE DMG Bonus 700, PvE Mitigation 700), app shows current total vs
target and gap remaining

Key Data Rules

Purple and Gold feathers only — no blue

Default target tier: T7 — sweet spot before cost spike. Warn visually if tier > T7

Upgrade cost confirmed: Purple T1→T20 fully confirmed. Gold T1→T7 confirmed per feather type

Order and Truth (MIX purple): only T1–T2 confirmed — show warning if selected

Set bonus mid-tier values: only Raven's Prestige is fully confirmed T1–T9. Other sets only have T20 max — interpolate
and mark as estimated

As for class presets, maybe we can save as json or csv inside @data\\

Since my main classes is Paladin, here what I do
Paladin Sacrifice Build

Priority stats: VIT, Ignore PDEF, PvE DMG Bonus, PvE DMG Reduction, MaxHP, PDEF, MDEF

Hidden/excluded stats: STR, PATK — zero benefit for Sacrifice, don't show for this class

Optimal ATK set: Time + Day + Sky (gold) + Grace + Justice (MIX purple) → Raven's Prestige

Optimal DEF set: Nature + Night + Terra (gold) + Virtue + Soul (purple) → Raven's Prestige

Tech Constraints
As for now, for this MVP, I just want to host on GitHub page, for now.
Mobile Friendly
The data will be on the same repo

Do ask any questions if you unclear with anything. We do QnA until you understand what we need

And also, Add 1 more tab, maybe tab called support me, where I will put my QR or Paypall or Gcash or anytype of link
that people can use to sponsor me lol

Q1 — Set bonus tier logic (critical)
For raven_prestige, the CSV has tier 1–9 and 20. In-game, what determines which tier of the set bonus is active — is
it the minimum feather tier across all 5 feathers in the set, the average, or something else entirely?

1. Yes the minimum feather tier across 5 slot

Q2 — Multiple sets, same config?
You have 5 ATK sets (Duel, Rune, Weapon, Intimidation, Omni). Can each one have a different feather loadout? e.g. Duel
 runs Time+Day+Sky+Grace+Justice, while Rune runs Space+Time+Sky+Grace+Justice? Or is the Paladin preset the same
across all 5 ATK sets?
2. Can, I will leave to your reasoning and analytic to find out the most optimal feather allocation

Q3 — Unlocked sets
Not every player has all 10 sets. Should the planner let users toggle which sets are "unlocked", and only count
stats/costs from unlocked ones?
3. Yes please. I forget the level requirment to unlock each set, but yeah, lets do it manual. Maybe default is 1 set
(both atk and def) unlock

Q4 — Tech stack
For GitHub Pages with no build step, I'd go with a single index.html + vanilla JS (no framework, no npm needed — just
push and it works). Is that fine, or do you want React/Vue with a build pipeline?
4. single.html, when we grow the pages more, we will change it to next.js

Q5 — Support Me tab
What do you want to put there? PayPal link? GCash QR image? Ko-fi? I'll need the actual links/images from you. For now
 should I build a placeholder you can fill in later?
 5. I already put 1, Touch n Go QR

Q6 — Stat display names
The CSV columns use shorthand (patk_matk, pve_dmg_bonus, etc.). What are the in-game display names you want shown in
the UI? e.g. pve_dmg_bonus → "PvE DMG Bonus"? Or do you have specific wording from the game?
6. Yeah, it PvE DMG Bonus, patk_matk is PATK/MATK
  




