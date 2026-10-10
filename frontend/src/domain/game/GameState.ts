import type { DungeonRun } from "../dungeon/DungeonRun.ts";
import type { Monster } from "../monsters/Monster.ts";
import { spawnRunMonsters } from "../monsters/MonsterPlacement.ts";
import { createPlayerStats, type PlayerStats } from "./PlayerStats.ts";

export type GameState = {
	run: DungeonRun;
	turn: number;
	player: PlayerStats;
	monsters: readonly Monster[];
};

export const createGameState = (run: DungeonRun): GameState => ({
	run,
	turn: 0,
	player: createPlayerStats(),
	monsters: spawnRunMonsters(run),
});
