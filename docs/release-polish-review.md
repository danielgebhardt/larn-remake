# Alpha exploration and player-status polish

Epic #226; stories #227–230 on `codex/alpha-inventory-polish`. One tested commit per story. Developer acceptance and release tagging remain pending.

## #227 — Quiet map focus

The orange frame was the map's two-pixel amber focus-visible outline. Programmatic focus returned from hotbar interactions can retain keyboard focus-visible modality, so removing focus would break shortcuts. The map now uses a thin inset neutral outline, preserving an accessible focus cue without the large orange frame. Existing potion, spell and map-keyboard interaction tests pass; gameplay/focus handling is unchanged.

## #228 — Layout diagnostics

`frontend/scripts/review-layout.mjs` produces read-only JSON per floor and an aggregate for fixed seeds/configuration. It measures legal entry-to-downstairs steps, maximum entry-to-room-center distance, longest planned corridor and actual articulation tiles (a tile whose removal disconnects its floor component). Unreachable counts identify connectivity failures. The final floor has no down-stair distance and is excluded from that mean. Planned corridor lengths include room segments; topology is not human turn count or a combat win-rate model. Iterative graph traversal avoids recursion on maximum maps. Tests cover a hallway, loop, branching root, disconnected tiles and a 100×100 open floor.

Before loops, matched seeds 0, 1, 123, 987 and 2215353587 at 60×60×20 (100 floors): mean stair steps **66.18**, mean maximum room distance **129.08**, mean bottleneck tiles **181.46**, mean longest planned corridor **45.89**, unreachable tiles **0**.

Run from frontend: `node scripts/review-layout.mjs 0 1 123 987 2215353587 --summary-only`. Omit summary-only for individual floor records; rows/cols/floors and seed batches use the existing validated review CLI conventions.
