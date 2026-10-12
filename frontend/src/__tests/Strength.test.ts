// @vitest-environment node

import { describe, expect, it } from "vitest";
import { deriveAttributes } from "../domain/game/Attributes";
import { deriveCombatStats } from "../domain/game/CombatStats";
import { createGameState, type GameState } from "../domain/game/GameState";
import {
	createEquipment,
	createStartingEquipment,
} from "../domain/items/Equipment";
import { bagWithSpareGear } from "./CarriedGearTestHelpers";
import { resolvePlayerActionWithHits } from "./ControlledCombatTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

describe("Earned Strength", () => {
	it.each([
		[0, 10, 0],
		[10, 10, 0],
		[29, 10, 0],
		[30, 12, 1],
		[60, 12, 1],
		[100, 14, 2],
		[1000, 20, 5],
	])(
		"derives earned Strength from %i XP",
		(experience, strength, strengthModifier) => {
			expect(deriveAttributes({ experience })).toMatchObject({
				strength,
				strengthModifier,
			});
		},
	);
	it("adds Strength once alongside the weapon and also improves unarmed damage", () => {
		const progression = { experience: 30 };
		expect(
			deriveCombatStats(createStartingEquipment(), progression),
		).toMatchObject({
			baseAttack: 1,
			weaponBonus: 1,
			strengthBonus: 1,
			attack: 3,
			armor: 1,
		});
		expect(deriveCombatStats(createEquipment(), progression)).toMatchObject({
			weaponBonus: 0,
			strengthBonus: 1,
			attack: 2,
			armor: 0,
		});
	});
	it("uses newly earned Strength on the next attack, leaving monster damage unchanged", () => {
		const initial = {
			...createGameState(createCorridorEncounter()),
			bag: bagWithSpareGear(),
		};
		const before: GameState = {
			...initial,
			run: { ...initial.run, playerCoordinate: { row: 1, col: 2 } },
			progression: { experience: 29 },
			player: { health: 10, maxHealth: 12 },
			monsters: [
				{
					intent: { type: "idle" as const },
					id: "1:1",
					kind: "giant-rat",
					floorNumber: 1,
					coordinate: { row: 1, col: 3 },
					health: 1,
				},
				{
					intent: { type: "idle" as const },
					id: "1:2",
					kind: "goblin",
					floorNumber: 1,
					coordinate: { row: 1, col: 1 },
					health: 9,
				},
			],
		};
		const gained = resolvePlayerActionWithHits(before, {
			type: "move",
			direction: "right",
		}).state;
		expect(gained.activityHistory.entries[0].event).toMatchObject({
			type: "player-hit",
			damage: 2,
		});
		expect(deriveAttributes(gained.progression).strength).toBe(12);
		expect(
			gained.activityHistory.entries.map((entry) => entry.event),
		).toContainEqual({
			type: "attribute-gained",
			attribute: "Strength",
			value: 12,
			turn: 1,
		});
		const next = resolvePlayerActionWithHits(gained, {
			type: "move",
			direction: "left",
		}).state;
		expect(next.monsters[0].health).toBe(6);
		expect(next.activityHistory.entries.at(-1)?.event).toMatchObject({
			type: "monster-hit",
			damage: 1,
		});
		expect(before.progression.experience).toBe(29);
	});
	it("keeps earned Strength when equipping and removing a weapon, then resets on replay", () => {
		const initial = {
			...createGameState(createCorridorEncounter()),
			bag: bagWithSpareGear(),
		};
		const before = {
			...initial,
			monsters: [],
			progression: { experience: 30 },
		};
		const equipped = resolvePlayerActionWithHits(before, {
			type: "equip",
			itemId: "carried:sword",
			slot: "mainHand",
		}).state;
		expect(
			deriveCombatStats(equipped.equipment, equipped.progression).attack,
		).toBe(4);
		const unarmed = resolvePlayerActionWithHits(equipped, {
			type: "unequip",
			slot: "mainHand",
		}).state;
		expect(deriveAttributes(unarmed.progression).strength).toBe(12);
		expect(
			deriveCombatStats(unarmed.equipment, unarmed.progression).attack,
		).toBe(2);
		expect(
			deriveAttributes(createGameState(initial.run).progression).strength,
		).toBe(10);
	});
});
