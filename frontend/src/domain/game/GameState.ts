import type { DungeonRun } from "../dungeon/DungeonRun.ts";
import { createPlayerStats, type PlayerStats } from "./PlayerStats.ts";

export type GameState = {
	run: DungeonRun;
	turn: number;
	player: PlayerStats;
};

export const createGameState = (run: DungeonRun): GameState => ({
	run,
	turn: 0,
	player: createPlayerStats(),
});
