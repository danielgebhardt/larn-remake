# Alpha inventory and visual usability polish

Branch: `codex/alpha-inventory-polish`. Epic #216; stories #217–222. One tested commit per story, awaiting developer acceptance. No push/merge/deployment.

## #217 — Potion stacks and 27 slots

Bag capacity counts occupied slots: identical potion kinds group together, while gear remains individual. The grid displays quantity and its accessible description; it has nine 48px tiles per row at 1280px and larger, seven on intermediate desktops and four on narrow screens. All 27 slots remain visible as occupied/empty cells. The domain retains individual bottle identities, so drink/drop/hotbar ownership stays unchanged and only one bottle transfers or disappears per action. Matching pickup succeeds at full slot capacity. Multiple reachable pickup candidates still use the chooser when an eligible stack or book can be selected.

Format v11 records the expanded bag contract without replacing item instances with quantity fields. Old source versions retain their twenty-copy structural validation, migrate all actual items and group only in the view/capacity rule. Current validation checks every physical instance, duplicate ownership and occupied slots; physical copies are independently bounded at 10,000. Captured old fixtures remain unchanged. Existing capacity tests now fill 27 gear slots, while new domain/UI tests cover grouped quantities, full-bag matching pickup, one-bottle consumption/drop and old/current saved bags. Generated maximum-run stress checks get an explicit 15-second allowance under concurrent suites.
