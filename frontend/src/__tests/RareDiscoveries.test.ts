// @vitest-environment node
import { expect, it } from "vitest";
import {
	connectDungeonFloors,
	generateDungeonRun,
} from "../domain/dungeon/DungeonRun";
import { DEFAULT_RUN_CONFIGURATION } from "../domain/dungeon/RunConfiguration";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { ITEM_DEFINITIONS } from "../domain/items/Item";
import { protectedFloorLocations } from "../domain/monsters/MonsterLocations";
import {
	createSaveDocument,
	parseSave,
	restoreSave,
	serializeSave,
} from "../domain/saves/SaveFormat";
import { savedAdventure } from "./SaveTestHelpers";

const encounter = (kind: "reliquary" | "archive") => {
	const saved = restoreSave(savedAdventure());
	return {
		...saved,
		state: {
			...saved.state,
			player: { health: 10, maxHealth: 10 },
			monsters: [],
			objects: [
				{
					id: `floor:1:object:${kind}:1`,
					kind,
					floorNumber: 1,
					coordinate: { row: 7, col: 8 },
					activated: false,
				},
			],
			run: { ...saved.state.run, playerCoordinate: { row: 7, col: 7 } },
		},
	};
};
it("breaking a relic seal trades a stated wound for one retained relic, including after loading", () => {
	const saved = encounter("reliquary");
	const initial = saved.state;
	expect(resolvePlayerAction(initial, { type: "interact" }).turnAdvanced).toBe(
		false,
	);
	const result = resolvePlayerAction(initial, {
		type: "interact",
		choice: "unseal",
	}).state;
	expect(result.player.health).toBe(7);
	expect(
		result.floorItems.some((entry) => entry.item.kind === "relic-band"),
	).toBe(true);
	expect(result.objects[0].activated).toBe(true);
	const doc = createSaveDocument(
		result,
		saved.exploration,
		saved.configuration,
		saved.fog,
	);
	expect(parseSave(serializeSave(doc)).ok).toBe(true);
	expect(
		resolvePlayerAction(restoreSave(doc).state, {
			type: "interact",
			choice: "unseal",
		}).turnAdvanced,
	).toBe(false);
});
it("archives only release selected run books within their floor bands, or a mana supply fallback", () => {
	for (let seed = 0; seed < 12; seed++) {
		const run = connectDungeonFloors(
			generateDungeonRun(seed, 20, DEFAULT_RUN_CONFIGURATION),
		);
		const initial = createGameState(run);
		const selected = new Set(
			initial.floorItems
				.filter(
					(entry) => ITEM_DEFINITIONS[entry.item.kind].type === "spellbook",
				)
				.map((entry) => entry.item.kind),
		);
		for (const object of initial.objects.filter(
			(object) => object.kind === "archive",
		)) {
			const state = {
				...initial,
				run: {
					...run,
					activeFloor: object.floorNumber,
					playerCoordinate: object.coordinate,
				},
				monsters: [],
			};
			const result = resolvePlayerAction(state, {
				type: "interact",
				objectId: object.id,
				choice: "read",
			}).state;
			const reward = result.floorItems.find(
				(entry) => entry.item.id === `${object.id}:reward`,
			);
			expect(reward).toBeDefined();
			if (!reward) throw new Error("Missing archive reward");
			const definition = ITEM_DEFINITIONS[reward.item.kind];
			if (definition.type === "spellbook") {
				expect(selected.has(reward.item.kind)).toBe(true);
				expect(object.floorNumber).toBeGreaterThanOrEqual(definition.minFloor);
				expect(object.floorNumber).toBeLessThanOrEqual(definition.maxFloor);
			} else expect(reward.item.kind).toBe("mana-potion");
		}
	}
});
it("rare room finds have bounded independent placement without changing terrain or protected routes", () => {
	const run = connectDungeonFloors(
		generateDungeonRun(7, 20, DEFAULT_RUN_CONFIGURATION),
	);
	const state = createGameState(run);
	const rare = state.objects.filter(
		(object) => object.kind === "archive" || object.kind === "reliquary",
	);
	expect(rare.length).toBeGreaterThan(0);
	expect(rare.length).toBeLessThan(12);
	expect(state.run).toBe(run);
	expect(createGameState(run).objects).toEqual(state.objects);
	for (const object of rare) {
		expect(protectedFloorLocations(run, object.floorNumber)).not.toContainEqual(
			object.coordinate,
		);
		expect(object.floorNumber).toBeGreaterThanOrEqual(
			object.kind === "reliquary" ? 8 : 3,
		);
	}
});
