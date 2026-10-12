// @vitest-environment node
import { expect, it } from "vitest";
import { updateExploration } from "../domain/dungeon/Exploration";
import { DEFAULT_FOG_CONFIGURATION } from "../domain/dungeon/RunConfiguration";
import type { GameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import {
	createSaveDocument,
	parseSave,
	restoreSave,
	serializeSave,
} from "../domain/saves/SaveFormat";
import { bruteEncounter } from "./BruteTestHelpers";
import { COMPACT_TEST_CONFIGURATION } from "./TestRunConfiguration";

it("preserves the fixed area and response timer through saves and inactive floors", () => {
	const initial = bruteEncounter();
	initial.monsters = [
		{ ...initial.monsters[0], kind: "salamander", health: 24 },
	];
	const prepared = resolvePlayerAction(initial, { type: "wait" }).state;
	const inactive = {
		...prepared,
		run: {
			...prepared.run,
			activeFloor: 5,
			playerCoordinate: { row: 1, col: 1 },
		},
	};
	const paused = resolvePlayerAction(inactive, { type: "wait" }).state;
	expect(paused.monsters[0].intent).toEqual(prepared.monsters[0].intent);
	const doc = createSaveDocument(
		paused,
		updateExploration(paused.run, DEFAULT_FOG_CONFIGURATION.radius),
		COMPACT_TEST_CONFIGURATION,
		DEFAULT_FOG_CONFIGURATION,
	);
	const parsed = parseSave(serializeSave(doc));
	expect(parsed.ok).toBe(true);
	if (!parsed.ok) throw new Error(parsed.error);
	const restored = restoreSave(parsed.value).state;
	expect(restored).toEqual(paused);
	let resumed: GameState = {
		...restored,
		run: {
			...restored.run,
			activeFloor: 4,
			playerCoordinate: prepared.run.playerCoordinate,
		},
	};
	let uninterrupted: GameState = {
		...paused,
		run: {
			...paused.run,
			activeFloor: 4,
			playerCoordinate: prepared.run.playerCoordinate,
		},
	};
	for (const direction of ["up", "up"] as const) {
		resumed = resolvePlayerAction(resumed, { type: "move", direction }).state;
		uninterrupted = resolvePlayerAction(uninterrupted, {
			type: "move",
			direction,
		}).state;
		expect(resumed).toEqual(uninterrupted);
	}
	expect(resumed.player.health).toBe(10);
	const invalid = {
		...doc,
		state: {
			...doc.state,
			monsters: doc.state.monsters.map((monster) => ({
				...monster,
				intent: { ...monster.intent, radius: 9 },
			})),
		},
	};
	expect(parseSave(JSON.stringify(invalid)).ok).toBe(false);
	for (const patch of [
		{ element: "cold" },
		{ remaining: 3 },
		{ target: { row: 0, col: 0 } },
	]) {
		const altered = {
			...doc,
			state: {
				...doc.state,
				monsters: doc.state.monsters.map((actor) => ({
					...actor,
					intent: { ...actor.intent, ...patch },
				})),
			},
		};
		expect(parseSave(JSON.stringify(altered)).ok).toBe(false);
	}
});
