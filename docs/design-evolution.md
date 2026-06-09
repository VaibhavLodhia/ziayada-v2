# Design Evolution

## System vs layout

The design **system** is the stable layer: tokens (parchment and obsidian), typography (Fraunces, Geist Mono, Geist), and primitives (Field, Pill, StatePill, HashSeal, Stamp, Glyph, ClassifyRow, DecisionRow). These do not change between product phases.

The **layout** is composition. Each phase arranges the same primitives differently:

- **Private (v2 today):** the interview on `/home`. One person, one Field, seal at the end with ClassifyRow teaching the five states.
- **Shared (Phase 2):** presence and contribution layers. Same Field becomes multi-author input; HashSeal attributes each turn. Stub at `/shared`.
- **Public (Phase 3):** discovery and trust signals on public agent listings. Same DecisionRow and TrustPill, different page goal. Stub at `/public`.

## Why Interview

Mediation states (RESPOND, NARROW, FLAG, DEFER, EXPLORE) are never user input. They appear at the seal moment with all five glyphs visible so users learn the taxonomy from their own decisions. Plain-language captions ("act now", "focus in") replace jargon.

UI copy avoids security theater terms. We say "Private by design" and "Audit trail" instead of "zero-trust" or "RLS."

The `/shared` and `/public` routes document which primitives Phase 2 and Phase 3 will compose. The language stays one system; only the arrangement grows.
