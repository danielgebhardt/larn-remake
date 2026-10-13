// @vitest-environment node
import { describe, expect, it } from "vitest";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import {
	createSaveDocument,
	parseSave,
	restoreSave,
	serializeSave,
} from "../domain/saves/SaveFormat";
import { savedAdventure } from "./SaveTestHelpers";

const alarmAdventure = () => {
	const document = savedAdventure(),
		actor = document.state.monsters.find((actor) => actor.floorNumber === 2);
	if (!actor) throw new Error("Expected inactive actor");
	const floor = document.state.run.floors[1];
	const target = [
		{ row: actor.coordinate.row, col: actor.coordinate.col + 1 },
		{ row: actor.coordinate.row + 1, col: actor.coordinate.col },
		{ row: actor.coordinate.row, col: actor.coordinate.col - 1 },
		{ row: actor.coordinate.row - 1, col: actor.coordinate.col },
	].find((point) => floor.terrain[point.row]?.[point.col] === ".");
	if (!target) throw new Error("Expected adjacent target");
	return {
		...document,
		state: {
			...document.state,
			objects: [],
			run: { ...document.state.run, activeFloor: 2, playerCoordinate: target },
			monsters: [
				{
					...actor,
					kind: "alarm-sentry" as const,
					health: 8,
					intent: { type: "preparing-alarm" as const, target },
				},
			],
		},
	};
};
describe("Saved one-shot alarm", () => {
	it("resumes preparation and retains the sounded flag without another alarm", () => {
		const document = alarmAdventure(),
			parsed = parseSave(serializeSave(document));
		if (!parsed.ok) throw new Error(parsed.error);
		const restored = restoreSave(parsed.value);
		const sounded = resolvePlayerAction(restored.state, { type: "wait" }).state;
		const written = createSaveDocument(
			sounded,
			restored.exploration,
			restored.configuration,
			restored.fog,
		);
		const loaded = parseSave(serializeSave(written));
		if (!loaded.ok) throw new Error(loaded.error);
		const next = resolvePlayerAction(restoreSave(loaded.value).state, {
			type: "wait",
		}).state;
		expect(next.monsters[0].alarmUsed).toBe(true);
		expect(
			next.activityHistory.entries.filter(
				(entry) => entry.event.type === "monster-alarm-sounded",
			),
		).toHaveLength(1);
	});
	it.each(["invalid flag", "already used preparation", "ordinary actor"])(
		"rejects %s",
		(kind) => {
			const document = alarmAdventure(),
				actor = document.state.monsters[0];
			const modified = {
				...actor,
				alarmUsed: kind === "invalid flag" ? "yes" : true,
				...(kind === "ordinary actor"
					? { kind: "goblin", health: 4, intent: { type: "idle" } }
					: {}),
			};
			expect(
				parseSave(
					JSON.stringify({
						...document,
						state: { ...document.state, monsters: [modified] },
					}),
				).ok,
			).toBe(false);
		},
	);
});
