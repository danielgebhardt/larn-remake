// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatActivityEvent } from "../components/game/ActivityMessages";
import { createGameState, type GameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { levelForExperience } from "../domain/game/Progression";
import type { MonsterKind } from "../domain/monsters/Monster";
import { resolvePlayerActionWithHits } from "./ControlledCombatTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const encounter = (kind: MonsterKind = "goblin"): GameState => ({
	...createGameState(createCorridorEncounter()),
	monsters: [
		{
			id: "1:1",
			kind,
			floorNumber: 1,
			coordinate: { row: 1, col: 2 },
			health: 1,
		},
	],
});
const attack = { type: "move", direction: "right" } as const;

describe("Experience from confirmed player kills", () => {
	it.each([
		["giant-rat", 2],
		["goblin", 5],
		["orc", 10],
	] as const)("awards %s XP exactly once", (kind, reward) => {
		const before = encounter(kind);
		const killed = resolvePlayerActionWithHits(before, attack).state;
		expect(killed.progression.experience).toBe(reward);
		expect(killed.monstersDefeated).toBe(1);
		const cleared = resolvePlayerActionWithHits(killed, attack).state;
		expect(cleared.progression.experience).toBe(reward);
		expect(before.progression.experience).toBe(0);
	});
	it("does not reward a miss or a surviving hit", () => {
		const before = encounter();
		const missed = resolvePlayerAction(before, attack, () => ({
			d20: () => 1,
			damage: () => {
				throw new Error("Miss must not roll damage");
			},
		})).state;
		expect(missed.progression.experience).toBe(0);
		const tough = {
			...before,
			monsters: before.monsters.map((monster) => ({ ...monster, health: 4 })),
		};
		expect(
			resolvePlayerActionWithHits(tough, attack).state.progression.experience,
		).toBe(0);
	});
	it("applies level-up health before surviving monsters retaliate in the same turn", () => {
		const before: GameState = {
			...encounter(),
			run: { ...encounter().run, playerCoordinate: { row: 1, col: 2 } },
			progression: { experience: 9 },
			player: { health: 2, maxHealth: 10 },
			monsters: [
				...encounter().monsters.map((monster) => ({
					...monster,
					coordinate: { row: 1, col: 3 },
				})),
				{
					id: "1:2",
					kind: "orc",
					floorNumber: 1,
					coordinate: { row: 1, col: 1 },
					health: 7,
				},
			],
		};
		const result = resolvePlayerActionWithHits(before, attack);
		expect(result.turnAdvanced).toBe(true);
		expect(result.state.turn).toBe(1);
		expect(result.state.progression.experience).toBe(14);
		expect(levelForExperience(result.state.progression.experience)).toBe(2);
		expect(result.state.player).toEqual({ health: 1, maxHealth: 12 });
		const messages = result.state.activityHistory.entries.map((entry) =>
			formatActivityEvent(entry.event),
		);
		expect(
			messages.findIndex((message) => message.includes("dies")),
		).toBeLessThan(
			messages.findIndex((message) => message.includes("gain 5 XP")),
		);
		expect(
			messages.findIndex((message) => message.includes("reach level 2")),
		).toBeLessThan(
			messages.findIndex((message) => message.includes("orc hits")),
		);
	});
	it("retains XP after the cap without granting another heal", () => {
		const before = {
			...encounter("orc"),
			progression: { experience: 100 },
			player: { health: 3, maxHealth: 18 },
		};
		const after = resolvePlayerActionWithHits(before, attack).state;
		expect(after.progression.experience).toBe(110);
		expect(after.player).toEqual(before.player);
		expect(
			after.activityHistory.entries.some(
				(entry) => entry.event.type === "level-gained",
			),
		).toBe(false);
	});
	it("does not grant XP for walking or waiting and resets XP on replay", () => {
		const run = createCorridorEncounter();
		let state: GameState = {
			...createGameState(run),
			monsters: [],
			progression: { experience: 8 },
		};
		state = resolvePlayerActionWithHits(state, { type: "wait" }).state;
		state = resolvePlayerActionWithHits(state, attack).state;
		expect(state.progression.experience).toBe(8);
		expect(createGameState(run).progression.experience).toBe(0);
	});
	it("cannot award XP after death or victory", () => {
		const before = encounter();
		const dead = { ...before, player: { health: 0, maxHealth: 10 } };
		expect(resolvePlayerActionWithHits(dead, attack).state).toBe(dead);
		const won = {
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
		expect(resolvePlayerActionWithHits(won, attack).state).toBe(won);
	});
});
