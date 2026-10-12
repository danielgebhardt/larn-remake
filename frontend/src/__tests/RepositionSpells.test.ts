// @vitest-environment node
import { expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { castSpell } from "../domain/game/SpellCasting";
import {
	orthogonalDistance,
	protectedFloorLocations,
} from "../domain/monsters/MonsterLocations";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const rolls = () => ({ d20: () => 20, damage: (min: number) => min });
it("Blink chooses a repeatable nearby unoccupied destination and spends one normal turn", () => {
	const initial = {
		...createGameState(createCorridorEncounter()),
		knownSpells: ["blink"] as const,
		monsters: [],
	};
	const first = resolvePlayerAction(
		initial,
		{ type: "cast", spell: "blink" },
		rolls,
	);
	const repeated = resolvePlayerAction(
		initial,
		{ type: "cast", spell: "blink" },
		rolls,
	);
	expect(first.state).toEqual(repeated.state);
	expect(first.state.run.playerCoordinate).not.toEqual(
		initial.run.playerCoordinate,
	);
	expect(
		orthogonalDistance(
			initial.run.playerCoordinate,
			first.state.run.playerCoordinate,
		),
	).toBeLessThanOrEqual(3);
	expect(protectedFloorLocations(initial.run, 1)).not.toContainEqual(
		first.state.run.playerCoordinate,
	);
	expect(first.state.turn).toBe(1);
	expect(first.state.mana).toBe(initial.mana - 4);
});
it("Blink with no safe destination leaves mana, turn and state untouched", () => {
	const run = createCorridorEncounter();
	const terrain = run.floors[0].terrain.map((row) => row.map(() => "#"));
	terrain[1][1] = ".";
	run.floors[0] = { ...run.floors[0], terrain };
	const initial = {
		...createGameState(run),
		knownSpells: ["blink"] as const,
		monsters: [],
	};
	const result = resolvePlayerAction(
		initial,
		{ type: "cast", spell: "blink" },
		rolls,
	);
	expect(result.state).toBe(initial);
	expect(result.error).toMatch(/destination/i);
});
it("Teleport Away preserves the enemy identity, health and conditions while canceling its prepared attack", () => {
	const initial = {
		...createGameState(createCorridorEncounter()),
		knownSpells: ["teleport-away"] as const,
		monsters: [
			{
				id: "1:1",
				kind: "orc" as const,
				floorNumber: 1,
				coordinate: { row: 1, col: 2 },
				health: 5,
				intent: {
					type: "preparing-attack" as const,
					target: { row: 1, col: 1 },
				},
			},
		],
		effects: [
			{ actorId: "1:1", floorNumber: 1, kind: "slowed" as const, remaining: 2 },
		],
	};
	const result = castSpell(
		initial,
		{ type: "cast", spell: "teleport-away", targetId: "1:1" },
		rolls,
	);
	expect("state" in result).toBe(true);
	if (!("state" in result)) throw new Error(result.error);
	const monster = result.state.monsters[0];
	expect(monster).toMatchObject({
		id: "1:1",
		health: 5,
		intent: { type: "idle" },
	});
	expect(
		orthogonalDistance(initial.run.playerCoordinate, monster.coordinate),
	).toBeGreaterThan(1);
	expect(protectedFloorLocations(initial.run, 1)).not.toContainEqual(
		monster.coordinate,
	);
	expect(result.state.effects).toEqual(initial.effects);
	expect(
		castSpell(
			initial,
			{ type: "cast", spell: "teleport-away", targetId: "1:1" },
			rolls,
		),
	).toEqual(result);
});

it("Blink avoids actors and announces items under its seeded landing tile", () => {
	const initial = {
		...createGameState(createCorridorEncounter()),
		knownSpells: ["blink"] as const,
		monsters: [],
	};
	const first = castSpell(initial, { type: "cast", spell: "blink" }, rolls);
	if (!("state" in first)) throw new Error(first.error);
	const coordinate = first.state.run.playerCoordinate;
	const withItem = {
		...initial,
		floorItems: [
			{
				item: { id: "landing", kind: "healing-potion" as const },
				floorNumber: 1,
				coordinate,
			},
		],
	};
	const landed = castSpell(withItem, { type: "cast", spell: "blink" }, rolls);
	if (!("state" in landed)) throw new Error(landed.error);
	expect(landed.state.activityHistory.entries.at(-1)?.event).toMatchObject({
		type: "items-seen",
		items: ["healing-potion"],
	});
	const occupied = {
		...initial,
		monsters: [
			{
				id: "1:1",
				kind: "orc" as const,
				floorNumber: 1,
				coordinate,
				health: 7,
				intent: { type: "idle" as const },
			},
		],
	};
	const avoided = castSpell(occupied, { type: "cast", spell: "blink" }, rolls);
	if (!("state" in avoided)) throw new Error(avoided.error);
	expect(avoided.state.run.playerCoordinate).not.toEqual(coordinate);
});
