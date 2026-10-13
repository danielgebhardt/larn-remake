// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
	connectDungeonFloors,
	generateDungeonRun,
} from "../domain/dungeon/DungeonRun";
import { updateExploration } from "../domain/dungeon/Exploration";
import { DEFAULT_FOG_CONFIGURATION } from "../domain/dungeon/RunConfiguration";
import { createGameState } from "../domain/game/GameState";
import { damageMonster } from "../domain/game/MonsterDamage";
import { ITEM_DEFINITIONS } from "../domain/items/Item";
import { createMonsterDrop } from "../domain/items/MonsterDrops";
import {
	eligibleMonsterKinds,
	MONSTER_DEFINITIONS,
	type Monster,
} from "../domain/monsters/Monster";
import { resistedDamage } from "../domain/monsters/MonsterResistance";
import {
	createSaveDocument,
	parseSave,
	restoreSave,
	serializeSave,
} from "../domain/saves/SaveFormat";
import { COMPACT_TEST_CONFIGURATION } from "./TestRunConfiguration";

const champion = (floor = 8): Monster => ({
	id: `${floor}:20001`,
	kind: "iron-champion",
	floorNumber: floor,
	coordinate: { row: 3, col: 3 },
	health: 32,
	intent: { type: "idle" },
});
describe("Optional iron champion and its equipment reward", () => {
	it("is reserved for optional encounters and has a readable elemental tradeoff", () => {
		expect(eligibleMonsterKinds(8)).not.toContain("iron-champion");
		expect(MONSTER_DEFINITIONS["iron-champion"].maxHealth).toBe(32);
		expect(resistedDamage("iron-champion", 10, "arcane")).toBe(5);
		expect(resistedDamage("iron-champion", 10, "cold")).toBe(20);
	});
	it("owns one reward after death and keeps it through save/load", () => {
		const configuration = { ...COMPACT_TEST_CONFIGURATION, floorCount: 10 };
		const fresh = createGameState(
			connectDungeonFloors(generateDungeonRun(123, 10, configuration)),
		);
		const original = fresh.monsters.find((actor) => actor.floorNumber === 8);
		const arrival = fresh.run.floors[7].downStair?.coordinate;
		if (!original || !arrival)
			throw new Error("Expected a floor-eight encounter");
		const actor = { ...champion(), coordinate: original.coordinate };
		const before = {
			...fresh,
			run: { ...fresh.run, activeFloor: 8, playerCoordinate: arrival },
			monsters: [
				...fresh.monsters.filter((monster) => monster.id !== original.id),
				actor,
			],
		};
		const killed = damageMonster(before, actor, 32, { type: "player-hit" });
		const rewardId = `monster:${actor.id}:loot`;
		expect(
			killed.floorItems.filter((entry) => entry.item.id === rewardId),
		).toHaveLength(1);
		expect(damageMonster(killed, actor, 32, { type: "player-hit" })).toBe(
			killed,
		);
		const document = createSaveDocument(
			killed,
			updateExploration(killed.run, 8),
			configuration,
			DEFAULT_FOG_CONFIGURATION,
		);
		const parsed = parseSave(serializeSave(document));
		if (!parsed.ok) throw new Error(parsed.error);
		expect(
			restoreSave(parsed.value).state.floorItems.filter(
				(entry) => entry.item.id === rewardId,
			),
		).toHaveLength(1);
	});

	it.each([8, 12, 20])(
		"guarantees deterministic equipment eligible for floor %i",
		(floor) => {
			const actor = champion(floor),
				reward = createMonsterDrop(123, actor);
			expect(reward).toEqual(createMonsterDrop(123, actor));
			if (!reward) throw new Error("Expected elite reward");
			const item = ITEM_DEFINITIONS[reward.item.kind];
			expect(["weapon", "shield", "chest-armor", "helmet", "ring"]).toContain(
				item.type,
			);
			expect(item.minFloor).toBeLessThanOrEqual(floor);
			expect(item.maxFloor).toBeGreaterThanOrEqual(floor);
			expect(item.minFloor).toBeGreaterThanOrEqual(Math.floor(floor / 2));
			expect(reward.item.id).toBe(`monster:${actor.id}:loot`);
		},
	);
});
