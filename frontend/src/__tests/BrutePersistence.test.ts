// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatActivityEvent } from "../components/game/ActivityMessages";
import { updateExploration } from "../domain/dungeon/Exploration";
import {
	DEFAULT_FOG_CONFIGURATION,
	DEFAULT_RUN_CONFIGURATION,
} from "../domain/dungeon/RunConfiguration";
import type { ActivityEvent } from "../domain/game/ActivityHistory";
import type { GameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import {
	createSaveDocument,
	parseSave,
	restoreSave,
	serializeSave,
} from "../domain/saves/SaveFormat";
import { bruteEncounter } from "./BruteTestHelpers";

const roundTrip = (state: GameState): GameState => {
	const document = createSaveDocument(
		state,
		updateExploration(state.run, DEFAULT_FOG_CONFIGURATION.radius),
		DEFAULT_RUN_CONFIGURATION,
		DEFAULT_FOG_CONFIGURATION,
	);
	const parsed = parseSave(serializeSave(document));
	if (!parsed.ok) throw new Error(parsed.error);
	return restoreSave(parsed.value).state;
};
const wait = (state: GameState) =>
	resolvePlayerAction(state, { type: "wait" }).state;

describe("Brute intent retention", () => {
	it("quest completion skips the pending phase and preserves the won run", () => {
		const before = bruteEncounter();
		before.run = {
			...before.run,
			activeFloor: 1,
			playerCoordinate: { row: 1, col: 2 },
		};
		before.monsters = [
			{
				...before.monsters[0],
				id: "1:1",
				floorNumber: 1,
				coordinate: { row: 2, col: 2 },
			},
		];
		before.quest = {
			...before.quest,
			entrance: { row: 1, col: 1 },
			cureRecovered: true,
		};
		before.floorItems = [];
		const prepared = wait(before);
		const won = resolvePlayerAction(prepared, {
			type: "move",
			direction: "left",
		}).state;
		expect(won.quest.victory).not.toBeNull();
		expect(won.player.health).toBe(10);
		expect(won.monsters).toBe(prepared.monsters);
		expect(won.activityHistory.entries.at(-1)?.event.type).toBe(
			"quest-completed",
		);
		expect(wait(won)).toBe(won);
	});

	it("resumes a real prepared attack with identical next-turn rolls, resources and history", () => {
		const prepared = wait(bruteEncounter());
		expect(prepared.monsters[0].intent.type).toBe("preparing-attack");
		const restored = roundTrip(prepared);
		expect(restored).toEqual(prepared);
		expect(wait(restored)).toEqual(wait(prepared));
		expect(wait(restored).monsters[0].intent.type).toBe("idle");
	});

	it("pauses across stairs and saves, then resolves the original target instead of the return tile", () => {
		const before = bruteEncounter();
		before.run = { ...before.run, playerCoordinate: { row: 13, col: 12 } };
		before.monsters = [
			{ ...before.monsters[0], coordinate: { row: 13, col: 11 } },
		];
		const prepared = wait(before);
		const descended = resolvePlayerAction(prepared, {
			type: "move",
			direction: "right",
		}).state;
		expect(descended.run.activeFloor).toBe(5);
		expect(descended.monsters).toBe(prepared.monsters);
		const paused = wait(descended);
		expect(paused.monsters).toBe(prepared.monsters);
		const restored = roundTrip(paused);
		expect(restored.monsters[0].intent).toEqual({
			type: "preparing-attack",
			target: { row: 13, col: 12 },
		});
		const away = resolvePlayerAction(restored, {
			type: "move",
			direction: "right",
		}).state;
		const returned = resolvePlayerAction(away, {
			type: "move",
			direction: "left",
		}).state;
		expect(returned.run.activeFloor).toBe(4);
		expect(returned.run.playerCoordinate).toEqual({ row: 13, col: 13 });
		expect(returned.monsters[0]).toMatchObject({
			coordinate: { row: 13, col: 11 },
			intent: { type: "idle" },
		});
		expect(returned.player.health).toBe(10);
		expect(
			returned.activityHistory.entries.slice(-2).map(({ event }) => event.type),
		).toEqual(["floor-changed", "monster-heavy-avoided"]);
	});

	it.each([
		{
			event: {
				type: "monster-prepared",
				monster: "dungeon-brute",
				target: { row: 4, col: 4 },
				turn: 1,
			},
			message:
				"Turn 1 — The dungeon brute prepares a heavy attack at your tile. Move away to dodge.",
		},
		{
			event: {
				type: "monster-heavy-hit",
				monster: "dungeon-brute",
				damage: 5,
				turn: 2,
			},
			message:
				"Turn 2 — The dungeon brute's heavy attack hits you for 5 damage.",
		},
		{
			event: {
				type: "monster-heavy-missed",
				monster: "dungeon-brute",
				turn: 2,
			},
			message: "Turn 2 — The dungeon brute's heavy attack misses you.",
		},
		{
			event: {
				type: "monster-heavy-avoided",
				monster: "dungeon-brute",
				turn: 2,
			},
			message: "Turn 2 — You avoid the dungeon brute's heavy attack.",
		},
	] satisfies { event: ActivityEvent; message: string }[])(
		"explains $event.type distinctly",
		({ event, message }) => {
			expect(formatActivityEvent(event)).toBe(message);
		},
	);
});
