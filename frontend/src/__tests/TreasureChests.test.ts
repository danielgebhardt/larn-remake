// @vitest-environment node
import { expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { BAG_CAPACITY } from "../domain/items/Bag";
import { ITEM_DEFINITIONS } from "../domain/items/Item";
import { chestReward } from "../domain/objects/TreasureChests";
import { createSaveDocument, restoreSave } from "../domain/saves/SaveFormat";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";
import { savedAdventure } from "./SaveTestHelpers";

const chest = {
	id: "floor:1:object:chest:1",
	kind: "chest" as const,
	floorNumber: 1,
	coordinate: { row: 1, col: 2 },
	activated: false,
};
const encounter = () => ({
	...createGameState(createCorridorEncounter()),
	monsters: [],
	floorItems: [],
	objects: [chest],
});
it("opens a chest once in one turn and leaves its fixed reward on the floor", () => {
	const initial = encounter();
	const first = resolvePlayerAction(initial, { type: "interact" });
	expect(first.turnAdvanced).toBe(true);
	expect(first.state.objects[0].activated).toBe(true);
	expect(first.state.floorItems).toHaveLength(1);
	expect(first.state.floorItems[0].coordinate).toEqual(chest.coordinate);
	expect(
		resolvePlayerAction(encounter(), { type: "interact" }).state.floorItems,
	).toEqual(first.state.floorItems);
	const repeated = resolvePlayerAction(first.state, { type: "interact" });
	expect(repeated.turnAdvanced).toBe(false);
	expect(repeated.state).toBe(first.state);
});
it("opening with a full bag retains loot until a slot becomes available", () => {
	const initial = {
		...encounter(),
		bag: {
			items: Array.from({ length: BAG_CAPACITY }, (_, index) => ({
				id: `carried:${index}`,
				kind: "short-sword" as const,
			})),
		},
	};
	const opened = resolvePlayerAction(initial, { type: "interact" }).state;
	expect(opened.bag.items).toHaveLength(BAG_CAPACITY);
	expect(opened.floorItems).toHaveLength(1);
	const stood = resolvePlayerAction(opened, {
		type: "move",
		direction: "right",
	}).state;
	const pickup = resolvePlayerAction(stood, {
		type: "pickup",
		itemId: opened.floorItems[0].item.id,
	});
	expect(pickup.turnAdvanced).toBe(false);
	expect(pickup.state.floorItems).toEqual(opened.floorItems);
});
it("keeps deep chest rewards inside the loot band and saves an opened chest without paying again", () => {
	const restored = restoreSave(savedAdventure());
	const object = { ...chest, coordinate: { row: 7, col: 8 } };
	const state = {
		...restored.state,
		run: { ...restored.state.run, playerCoordinate: { row: 7, col: 7 } },
		monsters: [],
		floorItems: restored.state.floorItems.filter(
			(entry) => entry.item.kind === "cure",
		),
		objects: [object],
	};
	const opened = resolvePlayerAction(state, { type: "interact" }).state;
	const document = createSaveDocument(
		opened,
		restored.exploration,
		restored.configuration,
		restored.fog,
	);
	const loaded = restoreSave(document).state;
	expect(loaded.objects[0].activated).toBe(true);
	expect(resolvePlayerAction(loaded, { type: "interact" }).turnAdvanced).toBe(
		false,
	);
	const reward = chestReward(123, {
		...chest,
		id: "floor:20:object:chest:1",
		floorNumber: 20,
	}).item;
	expect(ITEM_DEFINITIONS[reward.kind].maxFloor).toBeGreaterThanOrEqual(20);
});
