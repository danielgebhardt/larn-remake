// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState, type GameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { resolvePlayerActionWithHits } from "./ControlledCombatTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const encounter = (): GameState => ({
	...createGameState(createCorridorEncounter()),
	monsters: [
		{
			intent: { type: "idle" as const },
			id: "1:1",
			kind: "goblin",
			floorNumber: 1,
			coordinate: { row: 1, col: 4 },
			health: 9,
		},
	],
});
const cast = { type: "cast", spell: "magic-missile", targetId: "1:1" } as const;

describe("Magic Missile turns", () => {
	it("hits at range, spends exactly one turn and mana cost, then lets the survivor move", () => {
		const before = encounter();
		const result = resolvePlayerActionWithHits(before, cast);
		expect(result.turnAdvanced).toBe(true);
		expect(result.state).toMatchObject({
			turn: 1,
			mana: 7,
			player: { health: 10 },
			monsters: [{ health: 5, coordinate: { row: 1, col: 3 } }],
		});
		expect(result.state.run).toBe(before.run);
		expect(result.state.activityHistory.entries[0].event).toMatchObject({
			type: "spell-hit",
			spell: "magic-missile",
			damage: 4,
		});
		expect(before.monsters[0].health).toBe(9);
	});
	it.each([3, 5])(
		"always hits and supports the controlled damage boundary %i",
		(damage) => {
			const after = resolvePlayerAction(encounter(), cast, () => ({
				d20: () => 1,
				damage: () => damage,
			})).state;
			expect(after.monsters[0].health).toBe(9 - damage);
		},
	);
	it("passes through another monster while both survivors still take their normal phase", () => {
		const initial = encounter();
		const before = {
			...initial,
			monsters: [
				...initial.monsters,
				{
					intent: { type: "idle" as const },
					id: "1:2",
					kind: "giant-rat" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
					health: 9,
				},
			],
		};
		const after = resolvePlayerActionWithHits(before, cast).state;
		expect(after.monsters.find((monster) => monster.id === "1:1")?.health).toBe(
			5,
		);
		expect(after.monsters.find((monster) => monster.id === "1:2")?.health).toBe(
			9,
		);
		expect(after.player.health).toBe(9);
	});

	it("uses Intelligence, awards the same kill rewards and capacity before retaliation", () => {
		const initial = encounter();
		const before = {
			...initial,
			mana: 3,
			progression: { experience: 29 },
			run: { ...initial.run, playerCoordinate: { row: 1, col: 2 } },
			monsters: [
				{ ...initial.monsters[0], health: 1 },
				{
					intent: { type: "idle" as const },
					id: "1:2",
					kind: "giant-rat" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 1 },
					health: 9,
				},
			],
		};
		const after = resolvePlayerActionWithHits(before, cast).state;
		expect(after).toMatchObject({
			turn: 1,
			mana: 2,
			progression: { experience: 34 },
			monstersDefeated: 1,
			player: { health: 11, maxHealth: 12 },
		});
		const events = after.activityHistory.entries.map((e) => e.event.type);
		expect(events.slice(0, 5)).toEqual([
			"spell-hit",
			"monster-died",
			"gold-collected",
			"experience-gained",
			"level-gained",
		]);
		expect(events.at(-1)).toBe("monster-hit");
		const scaled = resolvePlayerActionWithHits(
			{ ...initial, progression: { experience: 100 } },
			cast,
		).state;
		expect(scaled.monsters[0].health).toBe(3);
	});
	it.each([
		"no mana",
		"unlearned",
		"stale",
		"other floor",
		"out of range",
		"wall",
		"dead",
		"won",
	])("rejects %s without changing the run", (scenario) => {
		let before = encounter();
		if (scenario === "no mana") before = { ...before, mana: 2 };
		if (scenario === "unlearned") before = { ...before, knownSpells: ["heal"] };
		if (scenario === "stale") before = { ...before, monsters: [] };
		if (scenario === "other floor")
			before = {
				...before,
				monsters: before.monsters.map((m) => ({ ...m, floorNumber: 2 })),
			};
		if (scenario === "out of range")
			before = {
				...before,
				monsters: before.monsters.map((m) => ({
					...m,
					coordinate: { row: 1, col: 8 },
				})),
			};
		if (scenario === "wall")
			before = {
				...before,
				run: {
					...before.run,
					floors: before.run.floors.map((f, i) =>
						i
							? f
							: {
									...f,
									terrain: f.terrain.map((r, j) =>
										j === 1 ? r.map((t, c) => (c === 2 ? "#" : t)) : r,
									),
								},
					),
				},
			};
		if (scenario === "dead")
			before = { ...before, player: { health: 0, maxHealth: 10 } };
		if (scenario === "won")
			before = {
				...before,
				quest: {
					...before.quest,
					victory: {
						seed: 123,
						floors: 2,
						turns: 1,
						monstersDefeated: 1,
						health: 10,
						level: 1,
						experience: 0,
					},
				},
			};
		const result = resolvePlayerActionWithHits(before, cast);
		expect(result.state).toBe(before);
		expect(result.turnAdvanced).toBe(false);
		expect(result.error).toBeTruthy();
	});
	it("accepts the exact range and preserves seeded replay independently of melee", () => {
		const before = {
			...encounter(),
			monsters: encounter().monsters.map((m) => ({
				...m,
				coordinate: { row: 1, col: 7 },
			})),
		};
		expect(resolvePlayerAction(before, cast)).toEqual(
			resolvePlayerAction(before, cast),
		);
		expect(resolvePlayerAction(before, cast).turnAdvanced).toBe(true);
	});
});
