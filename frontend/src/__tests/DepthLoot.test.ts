// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
	connectDungeonFloors,
	generateDungeonRun,
} from "../domain/dungeon/DungeonRun";
import { DEFAULT_RUN_CONFIGURATION } from "../domain/dungeon/RunConfiguration";
import { eligibleLootKinds, ITEM_DEFINITIONS } from "../domain/items/Item";
import { spawnRunItems } from "../domain/items/ItemPlacement";
import { selectLootKind } from "../domain/items/Loot";
import { createMonsterDrop } from "../domain/items/MonsterDrops";

const goblin = {
	id: "1:1",
	kind: "goblin" as const,
	floorNumber: 1,
	coordinate: { row: 1, col: 2 },
	health: 0,
};
describe("Depth-aware found and dropped loot", () => {
	it("selects from eligible relative weights and handles an empty pool", () => {
		expect(selectLootKind(1, "found", () => 0)).toBe("healing-potion");
		// At the potion band's upper boundary, selection advances to the next eligible item.
		const totalWeight = eligibleLootKinds(1, "found").reduce(
			(total, kind) => total + ITEM_DEFINITIONS[kind].foundWeight,
			0,
		);
		const nextBand =
			ITEM_DEFINITIONS["healing-potion"].foundWeight / totalWeight;
		expect(selectLootKind(1, "found", () => nextBand)).toBe("short-sword");
		expect(selectLootKind(2, "found", () => 0.999)).toBe("mana-potion");
		expect(selectLootKind(3, "found", () => 0.999)).toBe("mana-potion");
		expect(selectLootKind(21, "found", () => 0)).toBeUndefined();
	});
	it("uses monster drop chance boundaries without changing death location", () => {
		expect(createMonsterDrop(1, goblin, () => 0.5)).toBeUndefined();
		expect(createMonsterDrop(1, goblin, () => 0)).toMatchObject({
			floorNumber: 1,
			coordinate: goblin.coordinate,
			item: { kind: "healing-potion" },
		});
		expect(
			createMonsterDrop(1, { ...goblin, floorNumber: 21 }, () => 0),
		).toBeUndefined();
	});
	it("generates only eligible found items through floor 20", () => {
		const run = connectDungeonFloors(
			generateDungeonRun(123, 20, DEFAULT_RUN_CONFIGURATION),
		);
		const items = spawnRunItems(run, [], 10);
		for (const entry of items) {
			const definition = ITEM_DEFINITIONS[entry.item.kind];
			expect(entry.floorNumber).toBeGreaterThanOrEqual(definition.minFloor);
			expect(entry.floorNumber).toBeLessThanOrEqual(definition.maxFloor);
		}
		expect(items.some((entry) => entry.floorNumber === 20)).toBe(true);
		expect(spawnRunItems(run, [], 10)).toEqual(items);
	});
});
