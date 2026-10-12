// @vitest-environment node
import { expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createBag } from "../domain/items/Bag";
import { eligibleLootKinds } from "../domain/items/Item";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const tiers = [
	{ kind: "steel-sword", min: 4, max: 10, bonus: 3 },
	{ kind: "battle-axe", min: 8, max: 15, bonus: 4 },
	{ kind: "runeblade", min: 12, max: 20, bonus: 6 },
	{ kind: "star-forged-blade", min: 16, max: 20, bonus: 8 },
] as const;
it.each(tiers)(
	"finds and drops $kind only within its floor band",
	({ kind, min, max }) => {
		for (const source of ["found", "drop"] as const) {
			expect(eligibleLootKinds(min - 1, source)).not.toContain(kind);
			expect(eligibleLootKinds(min, source)).toContain(kind);
			expect(eligibleLootKinds(max, source)).toContain(kind);
			if (max < 20)
				expect(eligibleLootKinds(max + 1, source)).not.toContain(kind);
		}
	},
);
it.each(tiers)(
	"equipping $kind changes actual melee damage and costs a turn",
	({ kind, bonus }) => {
		const initial = {
			...createGameState(createCorridorEncounter()),
			monsters: [],
			bag: createBag([{ id: "weapon", kind }]),
		};
		const equipped = resolvePlayerAction(initial, {
			type: "equip",
			itemId: "weapon",
			slot: "mainHand",
		}).state;
		expect(equipped.turn).toBe(1);
		expect(equipped.bag.items[0].kind).toBe("short-sword");
		const target = {
			id: "1:1",
			kind: "dungeon-brute" as const,
			floorNumber: 1,
			coordinate: { row: 1, col: 2 },
			health: 10,
			intent: { type: "idle" as const },
		};
		const attacked = resolvePlayerAction(
			{ ...equipped, monsters: [target] },
			{ type: "move", direction: "right" },
			() => ({ d20: () => 20, damage: (min) => min }),
		).state;
		expect(attacked.monsters[0].health).toBe(10 - bonus);
	},
);
