// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import {
	connectDungeonFloors,
	generateDungeonRun,
} from "../domain/dungeon/DungeonRun";
import { createGameState, type GameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createBag } from "../domain/items/Bag";
import { spawnRunMonsters } from "../domain/monsters/MonsterPlacement";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";
import { COMPACT_TEST_CONFIGURATION } from "./TestRunConfiguration";

const initial = (): GameState => {
	const run = createCorridorEncounter();
	const state = createGameState(run);
	return {
		...state,
		monsters: spawnRunMonsters(run, 3),
		potionHotbar: [null, null, null, null],
		bag: createBag([
			...state.bag.items,
			{ id: "potion", kind: "healing-potion" },
		]),
	};
};
const play = () => {
	let state = initial();
	for (let i = 0; i < 20; i++)
		state = resolvePlayerAction(state, {
			type: "move",
			direction: "right",
		}).state;
	return state;
};
describe("Real seeded combat across complete action sequences", () => {
	it("replays the same fight, floor state, and history without global randomness", () => {
		const global = vi.spyOn(Math, "random").mockImplementation(() => {
			throw new Error("Combat must be independently seeded");
		});
		try {
			const result = play();
			expect(result.turn).toBeGreaterThan(0);
			expect(play()).toEqual(result);
		} finally {
			global.mockRestore();
		}
	});
	it("keeps the next attack unchanged after free configuration and rejected actions", () => {
		const before = initial();
		let configured = resolvePlayerAction(before, {
			type: "assign-hotbar",
			slot: 3,
			itemId: "potion",
		}).state;
		configured = resolvePlayerAction(configured, {
			type: "clear-hotbar",
			slot: 3,
		}).state;
		configured = resolvePlayerAction(configured, {
			type: "consume",
			itemId: "potion",
		}).state;
		configured = resolvePlayerAction(configured, {
			type: "move",
			direction: "up",
		}).state;
		expect(configured).toEqual(before);
		const attack = { type: "move", direction: "right" } as const;
		expect(resolvePlayerAction(configured, attack)).toEqual(
			resolvePlayerAction(before, attack),
		);
	});
	it("freezes real populated inactive floors while the active encounter evolves", () => {
		const before = createGameState(
			connectDungeonFloors(
				generateDungeonRun(0, 5, COMPACT_TEST_CONFIGURATION),
			),
		);
		const inactive = before.monsters.filter(
			(monster) => monster.floorNumber !== 1,
		);
		expect(inactive.length).toBeGreaterThan(0);
		let state = before;
		for (let i = 0; i < 5; i++)
			state = resolvePlayerAction(state, { type: "wait" }).state;
		expect(
			state.monsters.filter((monster) => monster.floorNumber !== 1),
		).toEqual(inactive);
		for (const monster of inactive)
			expect(state.monsters.find((actor) => actor.id === monster.id)).toBe(
				monster,
			);
	});
});
