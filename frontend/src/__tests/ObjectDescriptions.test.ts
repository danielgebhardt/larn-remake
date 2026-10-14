// @vitest-environment node
import { expect, it } from "vitest";
import { formatActivityEvent } from "../components/game/ActivityMessages";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const chest = {
	id: "floor:1:object:chest:1",
	kind: "chest" as const,
	floorNumber: 1,
	coordinate: { row: 1, col: 2 },
	activated: true,
};
const encounter = () => ({
	...createGameState(createCorridorEncounter()),
	monsters: [],
	floorItems: [],
	objects: [chest],
});
it("entering a spent chest describes its state once without another reward", () => {
	const initial = encounter();
	const arrived = resolvePlayerAction(initial, {
		type: "move",
		direction: "right",
	}).state;
	const messages = arrived.activityHistory.entries.map((entry) =>
		formatActivityEvent(entry.event),
	);
	expect(messages).toContain(
		"Turn 1 — Opened chest. Already opened; any remaining reward is on the floor. Press E on its tile to choose loot, or G to collect items here.",
	);
	expect(arrived.floorItems).toEqual([]);
	expect(
		resolvePlayerAction(arrived, { type: "wait" }).state.activityHistory,
	).toBe(arrived.activityHistory);
});
it("spent objects give specific free feedback rather than toggling or rerolling", () => {
	const state = encounter();
	const result = resolvePlayerAction(state, { type: "interact" });
	expect(result.turnAdvanced).toBe(false);
	expect(result.state).toBe(state);
	expect(result.error).toMatch(/Already opened/);
});

it("retains arrival descriptions through a validated save without replaying them on load", async () => {
	const { savedAdventure } = await import("./SaveTestHelpers");
	const { createSaveDocument, parseSave, restoreSave, serializeSave } =
		await import("../domain/saves/SaveFormat");
	const saved = restoreSave(savedAdventure());
	const state = {
		...saved.state,
		monsters: [],
		objects: [{ ...chest, coordinate: { row: 7, col: 8 } }],
		run: { ...saved.state.run, playerCoordinate: { row: 7, col: 7 } },
	};
	const entered = resolvePlayerAction(state, {
		type: "move",
		direction: "right",
	}).state;
	const doc = createSaveDocument(
		entered,
		saved.exploration,
		saved.configuration,
		saved.fog,
	);
	const parsed = parseSave(serializeSave(doc));
	expect(parsed.ok).toBe(true);
	if (!parsed.ok) throw new Error(parsed.error);
	const loaded = restoreSave(parsed.value).state;
	expect(loaded.activityHistory).toEqual(entered.activityHistory);
	expect(
		resolvePlayerAction(loaded, { type: "wait" }).state.activityHistory,
	).toBe(loaded.activityHistory);
});
