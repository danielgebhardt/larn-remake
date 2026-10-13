# Alpha exploration and player-status polish

Epic #226; stories #227–230 on `codex/alpha-inventory-polish`. One tested commit per story. Developer acceptance and release tagging remain pending.

## #227 — Quiet map focus

The orange frame was the map's two-pixel amber focus-visible outline. Programmatic focus returned from hotbar interactions can retain keyboard focus-visible modality, so removing focus would break shortcuts. The map now uses a thin inset neutral outline, preserving an accessible focus cue without the large orange frame. Existing potion, spell and map-keyboard interaction tests pass; gameplay/focus handling is unchanged.
