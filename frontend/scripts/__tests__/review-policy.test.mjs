// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createCorridorEncounter } from "../../src/__tests/MonsterEncounterTestHelpers";
import { createGameState } from "../../src/domain/game/GameState";
import { createBag } from "../../src/domain/items/Bag";
import { parseReviewOptions } from "../review-options.mjs";
import { chooseSpellAwareAction } from "../review-policy.mjs";

const quiet = () => ({
	...createGameState(createCorridorEncounter()),
	monsters: [],
	floorItems: [],
});
const route = () => ["right"];
describe("Explicit adventure review policies", () => {
	it("names the baseline by default and accepts only the named spell-aware alternative", () => {
		const defaults = { rows: 15, cols: 15, floorCount: 5 };
		const limits = {};
		expect(parseReviewOptions([], defaults, limits, 0xffffffff).policy).toBe(
			"baseline",
		);
		expect(
			parseReviewOptions(
				["--policy", "spell-aware"],
				defaults,
				limits,
				0xffffffff,
			).policy,
		).toBe("spell-aware");
		expect(() =>
			parseReviewOptions(["--policy", "unknown"], defaults, limits, 0xffffffff),
		).toThrow(/policy/);
	});
	it("ignores redundant equipment on the current tile and routes toward useful loot", () => {
		const initial = quiet();
		const redundant = {
			item: { id: "shield", kind: "wooden-shield" },
			floorNumber: 1,
			coordinate: initial.run.playerCoordinate,
		};
		const useful = {
			item: { id: "cap", kind: "leather-cap" },
			floorNumber: 1,
			coordinate: { row: 1, col: 3 },
		};
		const before = {
			...initial,
			bag: createBag(),
			floorItems: [redundant, useful],
		};
		expect(chooseSpellAwareAction(before, route)).toEqual({
			type: "move",
			direction: "right",
		});
		expect(
			chooseSpellAwareAction(
				{
					...before,
					floorItems: [{ ...useful, coordinate: initial.run.playerCoordinate }],
				},
				route,
			),
		).toEqual({ type: "pickup", itemId: "cap" });
	});
	it("uses actual known spells and mana without casting through a wall or spending unavailable mana", () => {
		const initial = quiet();
		const before = {
			...initial,
			bag: createBag(),
			monsters: [
				{
					id: "1:1",
					kind: "goblin",
					floorNumber: 1,
					coordinate: { row: 1, col: 4 },
					health: 9,
				},
			],
		};
		expect(chooseSpellAwareAction(before, route)).toEqual({
			type: "cast",
			spell: "magic-missile",
			targetId: "1:1",
		});
		expect(chooseSpellAwareAction({ ...before, mana: 2 }, route).type).toBe(
			"move",
		);
		expect(
			chooseSpellAwareAction({ ...before, knownSpells: ["heal"] }, route).type,
		).toBe("move");
		const blocked = {
			...before,
			run: {
				...before.run,
				floors: before.run.floors.map((floor, index) =>
					index
						? floor
						: {
								...floor,
								terrain: floor.terrain.map((row, i) =>
									i === 1
										? row.map((tile, col) => (col === 2 ? "#" : tile))
										: row,
								),
							},
				),
			},
		};
		expect(chooseSpellAwareAction(blocked, route).type).toBe("move");
	});
	it("uses healing and mana potions deliberately, without safe-waiting to refill", () => {
		const initial = { ...quiet(), bag: createBag() };
		expect(
			chooseSpellAwareAction(
				{ ...initial, player: { health: 3, maxHealth: 10 } },
				route,
			),
		).toEqual({ type: "cast", spell: "heal" });
		expect(
			chooseSpellAwareAction(
				{
					...initial,
					mana: 2,
					bag: createBag([{ id: "mana", kind: "mana-potion" }]),
				},
				route,
			),
		).toEqual({ type: "consume", itemId: "mana" });
		expect(chooseSpellAwareAction({ ...initial, mana: 0 }, route)).toEqual({
			type: "move",
			direction: "right",
		});
	});
});
