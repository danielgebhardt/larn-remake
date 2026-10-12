// @vitest-environment node
import { expect, it } from "vitest";
import { deriveAttributes } from "../domain/game/Attributes";
import {
	deriveCombatStats,
	resolveIncomingDamage,
} from "../domain/game/CombatStats";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createBag } from "../domain/items/Bag";
import { eligibleLootKinds } from "../domain/items/Item";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const tiers = [
	{ kind: "iron-shield", slot: "offHand", min: 4, max: 11, armor: 2 },
	{ kind: "tower-shield", slot: "offHand", min: 10, max: 20, armor: 3 },
	{ kind: "plate-armor", slot: "chest", min: 8, max: 16, armor: 3 },
	{ kind: "dragon-mail", slot: "chest", min: 14, max: 20, armor: 4 },
	{ kind: "steel-helmet", slot: "head", min: 8, max: 16, armor: 3 },
	{ kind: "runic-helmet", slot: "head", min: 14, max: 20, armor: 4 },
] as const;
it.each(tiers)(
	"$kind contributes armor from $slot and respects its floor band",
	({ kind, slot, min, max, armor }) => {
		for (const source of ["found", "drop"] as const) {
			expect(eligibleLootKinds(min - 1, source)).not.toContain(kind);
			expect(eligibleLootKinds(min, source)).toContain(kind);
			expect(eligibleLootKinds(max, source)).toContain(kind);
			if (max < 20)
				expect(eligibleLootKinds(max + 1, source)).not.toContain(kind);
		}
		const initial = {
			...createGameState(createCorridorEncounter()),
			monsters: [],
			bag: createBag([{ id: "armor", kind }]),
		};
		const equipped = resolvePlayerAction(initial, {
			type: "equip",
			itemId: "armor",
			slot,
		}).state;
		expect(equipped.turn).toBe(1);
		expect(equipped.equipment[slot]?.kind).toBe(kind);
		const total = armor + (slot === "offHand" ? 0 : 1);
		expect(
			deriveCombatStats(equipped.equipment, equipped.progression).armor,
		).toBe(total);
		expect(resolveIncomingDamage(10, total)).toBe(10 - total);
	},
);
it("a scholar robe trades chest armor for Intelligence rather than replacing a ring slot", () => {
	const initial = {
		...createGameState(createCorridorEncounter()),
		monsters: [],
		bag: createBag([{ id: "robe", kind: "scholar-robe" as const }]),
	};
	const equipped = resolvePlayerAction(initial, {
		type: "equip",
		itemId: "robe",
		slot: "chest",
	}).state;
	expect(
		deriveCombatStats(equipped.equipment, equipped.progression).armor,
	).toBe(2);
	expect(
		deriveAttributes(equipped.progression, [], equipped.equipment).intelligence,
	).toBe(12);
});
