// @vitest-environment node

import { describe, expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import {
	createEquipment,
	createStartingEquipment,
} from "../domain/items/Equipment";
import { ITEM_DEFINITIONS } from "../domain/items/Item";
import type { Monster } from "../domain/monsters/Monster";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";
import { createThreeFloorTraversalRun } from "./testhelpers";

describe("Starting equipment", () => {
	it("retains gear during combat without changing the existing damage rules", () => {
		const goblin: Monster = {
			id: "1:1",
			kind: "goblin",
			floorNumber: 1,
			coordinate: { row: 1, col: 2 },
			health: 4,
		};
		const equipped = {
			...createGameState(createCorridorEncounter()),
			monsters: [goblin],
		};
		const unequipped = { ...equipped, equipment: createEquipment() };
		const action = { type: "move", direction: "right" } as const;
		const result = resolvePlayerAction(equipped, action).state;
		const withoutGear = resolvePlayerAction(unequipped, action).state;
		expect(result.equipment).toBe(equipped.equipment);
		expect(result.monsters[0].health).toBe(2);
		expect(result.player.health).toBe(9);
		expect(result.turn).toBe(1);
		expect(result.monsters).toEqual(withoutGear.monsters);
		expect(result.player).toEqual(withoutGear.player);
		expect(result.activityHistory).toEqual(withoutGear.activityHistory);
	});
	it("gives a fresh character a named weapon and shield without changing health or terrain", () => {
		const run = createThreeFloorTraversalRun();
		const game = createGameState(run);
		expect(game.equipment.mainHand?.kind).toBe("short-sword");
		expect(game.equipment.offHand?.kind).toBe("wooden-shield");
		expect(ITEM_DEFINITIONS["short-sword"]).toMatchObject({
			name: "Short sword",
			type: "weapon",
		});
		expect(ITEM_DEFINITIONS["wooden-shield"]).toMatchObject({
			name: "Wooden shield",
			type: "shield",
		});
		expect(game.player).toEqual({ health: 10, maxHealth: 10 });
		expect(game.run).toBe(run);
		expect(game.turn).toBe(0);
	});
	it("creates independent loadouts with reproducible starting identities", () => {
		const first = createStartingEquipment();
		const next = createStartingEquipment();
		expect(next).toEqual(first);
		expect(next).not.toBe(first);
		expect(next.mainHand).not.toBe(first.mainHand);
		expect(next.offHand).not.toBe(first.offHand);
		expect(first.mainHand?.id).not.toBe(first.offHand?.id);
	});
	it("restores starting gear when a changed loadout is replayed", () => {
		const original = createGameState(createThreeFloorTraversalRun());
		const changed = { ...original, equipment: createEquipment() };
		const replay = createGameState(changed.run);
		expect(replay.equipment).toEqual(original.equipment);
		expect(changed.equipment).toEqual({ mainHand: null, offHand: null });
	});
	it("retains gear through walking, descent, ascent, waiting, and blocked movement", () => {
		const original = {
			...createGameState(createThreeFloorTraversalRun()),
			monsters: [],
		};
		const descended = resolvePlayerAction(original, {
			type: "move",
			direction: "right",
		}).state;
		expect(descended.run.activeFloor).toBe(2);
		const walked = resolvePlayerAction(descended, {
			type: "move",
			direction: "right",
		}).state;
		const ascended = resolvePlayerAction(walked, {
			type: "move",
			direction: "left",
		}).state;
		expect(ascended.run.activeFloor).toBe(1);
		const waited = resolvePlayerAction(ascended, { type: "wait" }).state;
		const blocked = resolvePlayerAction(waited, {
			type: "move",
			direction: "up",
		}).state;
		for (const game of [descended, walked, ascended, waited, blocked]) {
			expect(game.equipment).toBe(original.equipment);
		}
		expect(blocked).toBe(waited);
	});
});

describe("Equipment ownership", () => {
	it("allows empty slots", () => {
		expect(createEquipment()).toEqual({ mainHand: null, offHand: null });
	});
	it("distinguishes two copies of the same item kind by identity", () => {
		const first = createEquipment({ id: "sword:1", kind: "short-sword" });
		const second = createEquipment({ id: "sword:2", kind: "short-sword" });
		expect(first.mainHand?.kind).toBe(second.mainHand?.kind);
		expect(first.mainHand?.id).not.toBe(second.mainHand?.id);
	});
	it("rejects an item identity occupying both slots", () => {
		expect(() =>
			createEquipment(
				{ id: "same-item", kind: "short-sword" },
				{ id: "same-item", kind: "wooden-shield" },
			),
		).toThrow(/same item/i);
	});
	it("keeps shields out of the main hand and weapons out of the off hand", () => {
		expect(() =>
			createEquipment({ id: "shield:1", kind: "wooden-shield" }),
		).toThrow(/main hand/i);
		expect(() =>
			createEquipment(null, { id: "sword:1", kind: "short-sword" }),
		).toThrow(/off hand/i);
	});
});
