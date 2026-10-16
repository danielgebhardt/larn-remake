// @vitest-environment node
import { expect, it } from "vitest";
import {
	connectDungeonFloors,
	generateDungeonRun,
} from "../domain/dungeon/DungeonRun";
import { DEFAULT_RUN_CONFIGURATION } from "../domain/dungeon/RunConfiguration";
import { createGameState } from "../domain/game/GameState";
import { SPELL_DEFINITIONS } from "../domain/game/Spells";
import { ITEM_DEFINITIONS } from "../domain/items/Item";
import { selectedRunSpellbooks } from "../domain/items/SpellbookPlacement";
import { openDiscovery } from "../domain/objects/RareDiscoveries";

it("selects three to six distinct books deterministically and shares their copies with archives", () => {
	for (const seed of [1, 2, 123, 987]) {
		const run = connectDungeonFloors(
			generateDungeonRun(seed, 20, {
				...DEFAULT_RUN_CONFIGURATION,
				rows: 20,
				cols: 20,
			}),
		);
		const selected = selectedRunSpellbooks(run);
		expect(selected.length).toBeGreaterThanOrEqual(3);
		expect(selected.length).toBeLessThanOrEqual(6);
		expect(new Set(selected).size).toBe(selected.length);
		expect(selectedRunSpellbooks(run)).toEqual(selected);
		const base = createGameState(run);
		const book = base.floorItems.find(
			(x) => ITEM_DEFINITIONS[x.item.kind].type === "spellbook",
		);
		if (!book) throw new Error("Expected a placed book");
		const definition = ITEM_DEFINITIONS[book.item.kind];
		if (definition.type !== "spellbook") throw new Error("Expected a book");
		const archive = {
			id: "archive:test",
			kind: "archive" as const,
			floorNumber: book.floorNumber,
			coordinate: book.coordinate,
			activated: false,
		};
		const state = {
			...base,
			objects: [archive],
			knownSpells: Object.keys(SPELL_DEFINITIONS).filter(
				(x) => x !== definition.teaches,
			) as (keyof typeof SPELL_DEFINITIONS)[],
		};
		const opened = openDiscovery(state, archive, "read");
		if ("error" in opened) throw new Error(opened.error);
		expect(
			opened.floorItems.filter((x) => x.item.kind === book.item.kind),
		).toHaveLength(1);
		expect(
			opened.floorItems.find((x) => x.item.kind === book.item.kind)?.item.id,
		).toBe("archive:test:reward");
		expect(
			opened.floorItems.filter((x) => x.item.kind !== book.item.kind),
		).toEqual(base.floorItems.filter((x) => x.item.kind !== book.item.kind));
		const again = openDiscovery(
			opened,
			{ ...archive, id: "archive:second" },
			"read",
		);
		if ("error" in again) throw new Error(again.error);
		expect(again.floorItems.at(-1)?.item.kind).toBe("mana-potion");
	}
});
