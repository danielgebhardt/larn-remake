import { expect, it } from "vitest";
import type { GameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { bagSlots } from "../domain/items/Bag";
import {
	exitScrollArrival,
	readExitScroll,
} from "../domain/items/ExitDungeonScroll";
import { corridorContinuationAdventure } from "./CorridorContinuationTestHelpers";

const adventure = (): GameState => {
	const { state } = corridorContinuationAdventure();
	return {
		...state,
		quest: { ...state.quest, entrance: { row: 7, col: 1 } },
		run: {
			...state.run,
			floors: state.run.floors.map((f, i) =>
				i === 0 && f.downStair
					? {
							...f,
							downStair: { ...f.downStair, coordinate: { row: 7, col: 22 } },
						}
					: i === 1 && f.upStair
						? {
								...f,
								upStair: {
									...f.upStair,
									arrivalCoordinate: { row: 7, col: 22 },
								},
							}
						: f,
			),
		},
		monsters: [],
		effects: [],
		bag: {
			items: [
				{ id: "exit:1", kind: "exit-scroll" },
				{ id: "mana", kind: "mana-potion" },
				{ id: "exit:2", kind: "exit-scroll" },
			],
		},
	};
};
const read = (state: GameState, id = "exit:1") =>
	resolvePlayerAction(state, { type: "exit-dungeon", itemId: id });
it("returns to a deterministic adjacent tile, consumes one stable copy and commits one ordinary turn", () => {
	const state = adventure();
	const result = read(state);
	expect(result.turnAdvanced).toBe(true);
	expect(result.state.run.activeFloor).toBe(1);
	expect(result.state.run.playerCoordinate).toEqual({ row: 7, col: 2 });
	expect(result.state.turn).toBe(29);
	expect(result.state.player).toEqual(state.player);
	expect(result.state.mana).toBe(state.mana);
	expect(result.state.gold).toBe(state.gold);
	expect(result.state.merchantStock).toEqual(state.merchantStock);
	expect(result.state.bag.items.map((x) => x.id)).toEqual(["exit:2", "mana"]);
	expect(bagSlots(state.bag)[0].count).toBe(2);
	expect(bagSlots(result.state.bag)[0].count).toBe(1);
	expect(result.state.quest).toEqual(state.quest);
	expect(result.state.escape).toBeNull();
	expect(result.state.run.floors).toBe(state.run.floors);
	expect(
		result.state.activityHistory.entries.some(
			(x) => x.event.type === "exit-scroll-used",
		),
	).toBe(true);
	expect(read(state)).toEqual(result);
});
it.each([
	"ember",
	"missing",
	"wrong item",
	"dead",
	"victory",
	"already beside",
])("rejects %s without consuming, moving, or committing a turn", (reason) => {
	let state = adventure();
	let id = "exit:1";
	if (reason === "ember")
		state = {
			...state,
			quest: { ...state.quest, cureRecovered: true },
			escape: { startedTurn: 20, activatedFloors: [2] },
			floorItems: [],
		};
	if (reason === "missing") id = "missing";
	if (reason === "wrong item") id = "mana";
	if (reason === "dead")
		state = { ...state, player: { ...state.player, health: 0 } };
	if (reason === "victory")
		state = {
			...state,
			quest: {
				...state.quest,
				victory: {
					seed: 123,
					floors: 5,
					turns: 28,
					health: 5,
					level: 1,
					experience: 0,
					monstersDefeated: 0,
				},
			},
		};
	if (reason === "already beside")
		state = {
			...state,
			run: {
				...state.run,
				activeFloor: 1,
				playerCoordinate: { row: 7, col: 2 },
			},
		};
	const before = structuredClone(state);
	const result = read(state, id);
	expect(result.turnAdvanced).toBe(false);
	expect(result.state).toBe(state);
	expect(state).toEqual(before);
	if (reason === "ember") expect(result.error).toMatch(/ember/i);
});
it.each(["wall", "stair", "door", "spent object", "loot", "creature"])(
	"does not overwrite a %s or search beyond the entrance's neighbors",
	(obstacle) => {
		let state = adventure();
		const point = { row: 7, col: 2 };
		if (obstacle === "wall")
			state = {
				...state,
				run: {
					...state.run,
					floors: state.run.floors.map((f, i) =>
						i === 0
							? {
									...f,
									terrain: f.terrain.map((r, y) =>
										r.map((t, x) => (y === 7 && x === 2 ? "#" : t)),
									),
								}
							: f,
					),
				},
			};
		if (obstacle === "stair")
			state = {
				...state,
				run: {
					...state.run,
					floors: state.run.floors.map((f, i) =>
						i === 0 && f.downStair
							? { ...f, downStair: { ...f.downStair, coordinate: point } }
							: f,
					),
				},
			};
		if (obstacle === "door" || obstacle === "spent object")
			state = {
				...state,
				objects: [
					{
						id: "blocked",
						kind: obstacle === "door" ? "door" : "chest",
						floorNumber: 1,
						coordinate: point,
						activated: obstacle !== "door",
					},
				],
			};
		if (obstacle === "loot")
			state = {
				...state,
				floorItems: [
					...state.floorItems,
					{
						item: { id: "blocked", kind: "healing-potion" },
						floorNumber: 1,
						coordinate: point,
					},
				],
			};
		if (obstacle === "creature")
			state = {
				...state,
				monsters: [
					{
						id: "1:1",
						kind: "goblin",
						floorNumber: 1,
						coordinate: point,
						health: 4,
						intent: { type: "idle" },
					},
				],
			};
		expect(exitScrollArrival(state)).toBeUndefined();
		const result = read(state);
		expect(result.state).toBe(state);
		expect(result.turnAdvanced).toBe(false);
		expect(result.error).toMatch(/safe/i);
	},
);
it("can reposition within floor 1 and chooses another adjacent tile when the preferred one is occupied", () => {
	const remote = adventure();
	const state = {
		...remote,
		run: {
			...remote.run,
			activeFloor: 1,
			playerCoordinate: { row: 7, col: 8 },
			floors: remote.run.floors.map((f, i) =>
				i === 0
					? {
							...f,
							terrain: f.terrain.map((r, y) =>
								r.map((t, x) => (y === 6 && x === 1 ? "." : t)),
							),
						}
					: f,
			),
		},
	};
	expect(exitScrollArrival(state)).toEqual({ row: 6, col: 1 });
	const occupied = {
		...state,
		floorItems: [
			...state.floorItems,
			{
				item: { id: "north", kind: "healing-potion" as const },
				floorNumber: 1,
				coordinate: { row: 6, col: 1 },
			},
		],
	};
	expect(exitScrollArrival(occupied)).toEqual({ row: 7, col: 2 });
	expect(read(occupied).state.run.playerCoordinate).toEqual({ row: 7, col: 2 });
});
it("runs one arrival-floor monster/effect phase, freezes the departure floor, and retains consumption if the player dies", () => {
	const base = adventure();
	const state: GameState = {
		...base,
		turn: 29,
		player: { ...base.player, health: 1 },
		effects: [
			{ actorId: "player", floorNumber: null, kind: "poisoned", remaining: 2 },
			{ actorId: "2:1", floorNumber: 2, kind: "poisoned", remaining: 3 },
		],
		monsters: [
			{
				id: "1:1",
				kind: "goblin",
				floorNumber: 1,
				coordinate: { row: 7, col: 5 },
				health: 4,
				intent: { type: "idle" },
			},
			{
				id: "2:1",
				kind: "skeleton",
				floorNumber: 2,
				coordinate: { row: 7, col: 18 },
				health: 8,
				intent: { type: "idle" },
			},
		],
	};
	const result = read(state);
	expect(result.state.turn).toBe(30);
	expect(result.state.player.health).toBe(0);
	expect(result.state.monsters[0].coordinate).toEqual({ row: 7, col: 4 });
	expect(result.state.monsters[1]).toEqual(state.monsters[1]);
	expect(result.state.effects.find((x) => x.actorId === "2:1")).toEqual(
		state.effects[1],
	);
	expect(result.state.bag.items.some((x) => x.id === "exit:1")).toBe(false);
	expect(result.state.run.activeFloor).toBe(1);
});
it("direct scroll execution also rejects an ember-carrier", () => {
	const state = adventure();
	expect(
		readExitScroll(
			{ ...state, quest: { ...state.quest, cureRecovered: true } },
			{ type: "exit-dungeon", itemId: "exit:1" },
		),
	).toEqual({ error: expect.stringMatching(/ember/i) });
});

it("advances player poison and normal turn-30 mana recovery once on arrival", () => {
	const base = adventure();
	const state: GameState = {
		...base,
		turn: 29,
		effects: [
			{ actorId: "player", floorNumber: null, kind: "poisoned", remaining: 2 },
		],
	};
	const result = read(state);
	expect(result.state.turn).toBe(30);
	expect(result.state.player.health).toBe(state.player.health - 1);
	expect(result.state.mana).toBe(1);
	expect(result.state.effects[0].remaining).toBe(1);
});
