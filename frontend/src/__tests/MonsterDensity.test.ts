// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
	connectDungeonFloors,
	generateDungeonRun,
} from "../domain/dungeon/DungeonRun";
import { DEFAULT_RUN_CONFIGURATION } from "../domain/dungeon/RunConfiguration";
import {
	monsterCountForSpace,
	spawnRunMonsters,
} from "../domain/monsters/MonsterPlacement";

describe("Capped monster population density", () => {
	it.each([
		[0, 0],
		[1, 1],
		[20, 2],
		[60, 2],
		[61, 3],
		[360, 12],
		[5000, 12],
	])("uses %i safe tiles for %i monsters", (space, count) =>
		expect(monsterCountForSpace(space)).toBe(count),
	);
	it("caps large floors, preserves explicit counts, and reproduces populations", () => {
		const run = connectDungeonFloors(
			generateDungeonRun(0, 2, {
				...DEFAULT_RUN_CONFIGURATION,
				rows: 100,
				cols: 100,
			}),
		);
		const monsters = spawnRunMonsters(run);
		expect(monsters).toHaveLength(24);
		expect(spawnRunMonsters(run)).toEqual(monsters);
		expect(spawnRunMonsters(run, 1)).toHaveLength(2);
		expect(spawnRunMonsters(run, 0)).toEqual([]);
	});
});
