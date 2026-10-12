// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
	bruteEncounter,
	preparingBrute,
} from "../../src/__tests/BruteTestHelpers";
import { createBag } from "../../src/domain/items/Bag";
import { createRoutes } from "../review-routing.mjs";
import { chooseTacticalAwareAction } from "../review-tactics.mjs";

const choose = (state, memory) =>
	chooseTacticalAwareAction(
		state,
		createRoutes(
			state.run.floors[state.run.activeFloor - 1],
			state.run.playerCoordinate,
		),
		memory,
	);
const archerEncounter = () => {
	const state = bruteEncounter();
	return {
		...state,
		bag: createBag(),
		floorItems: [],
		run: { ...state.run, playerCoordinate: { row: 4, col: 4 } },
		monsters: [
			{
				id: "4:1",
				kind: "goblin-archer",
				floorNumber: 4,
				coordinate: { row: 4, col: 8 },
				health: 5,
				intent: { type: "idle" },
			},
		],
	};
};
describe("Tactical-aware diagnostic decisions", () => {
	it("takes recovery after one sheltering step instead of repeatedly moving between cover tiles", () => {
		const state = {
			...archerEncounter(),
			turn: 2,
			player: { health: 3, maxHealth: 10 },
		};
		const terrain = state.run.floors[3].terrain.map((row) => [...row]);
		terrain[3][6] = "#";
		state.run = {
			...state.run,
			floors: state.run.floors.map((floor, index) =>
				index === 3 ? { ...floor, terrain } : floor,
			),
		};
		expect(choose(state, { lastCover: { floor: 4, turn: 1 } })).toEqual({
			type: "cast",
			spell: "heal",
		});
	});
	it("dodges a fixed target before choosing a heal or equipment action", () => {
		const state = { ...preparingBrute(), player: { health: 3, maxHealth: 10 } };
		expect(choose(state)).toEqual({ type: "move", direction: "up" });
	});
	it("avoids every prepared target and occupied tile when selecting a dodge", () => {
		const state = preparingBrute();
		state.monsters = [
			...state.monsters,
			{
				...state.monsters[0],
				id: "4:2",
				coordinate: { row: 3, col: 5 },
				intent: { type: "preparing-attack", target: { row: 3, col: 4 } },
			},
			{
				...state.monsters[0],
				id: "4:3",
				kind: "goblin",
				coordinate: { row: 5, col: 4 },
				intent: { type: "idle" },
			},
		];
		expect(choose(state)).toEqual({ type: "move", direction: "left" });
	});
	it("does not dodge an inactive floor's preparation", () => {
		const state = preparingBrute();
		state.monsters = state.monsters.map((actor) => ({
			...actor,
			floorNumber: 3,
			id: "3:1",
		}));
		expect(choose(state).type).toBe("equip");
	});
	it("uses a guaranteed lethal spell when the prepared target has no free exit", () => {
		const state = {
			...preparingBrute(),
			bag: createBag(),
			player: { health: 3, maxHealth: 10 },
		};
		state.monsters = state.monsters.map((actor) => ({ ...actor, health: 3 }));
		const terrain = state.run.floors[3].terrain.map((row) => [...row]);
		terrain[3][4] = terrain[4][3] = terrain[5][4] = "#";
		state.run = {
			...state.run,
			floors: state.run.floors.map((floor, index) =>
				index === 3 ? { ...floor, terrain } : floor,
			),
		};
		expect(choose(state)).toEqual({
			type: "cast",
			spell: "magic-missile",
			targetId: "4:1",
		});
	});
	it("steps behind a wall before recovering instead of healing in a clear archer shot", () => {
		const state = {
			...archerEncounter(),
			player: { health: 3, maxHealth: 10 },
		};
		const terrain = state.run.floors[3].terrain.map((row) => [...row]);
		terrain[3][6] = "#";
		state.run = {
			...state.run,
			floors: state.run.floors.map((floor, index) =>
				index === 3 ? { ...floor, terrain } : floor,
			),
		};
		expect(choose(state)).toEqual({ type: "move", direction: "up" });
		const covered = {
			...state,
			run: { ...state.run, playerCoordinate: { row: 3, col: 4 } },
		};
		expect(choose(covered)).toEqual({ type: "cast", spell: "heal" });
	});
	it("prioritizes a visible shooting archer over a nearer harmless windup", () => {
		const state = archerEncounter();
		state.monsters = [
			{
				...bruteEncounter().monsters[0],
				id: "4:2",
				coordinate: { row: 5, col: 4 },
			},
			...state.monsters,
		];
		expect(choose(state)).toEqual({
			type: "cast",
			spell: "magic-missile",
			targetId: "4:1",
		});
	});
	it("ignores hidden archers and never rests just to regenerate mana", () => {
		const state = archerEncounter();
		state.monsters = state.monsters.map((actor) => ({
			...actor,
			coordinate: { row: 12, col: 12 },
		}));
		expect(choose({ ...state, mana: 0 }).type).toBe("move");
	});
});
