import {
	type DungeonRun,
	type MovementDirection,
	moveDungeonRun,
} from "../dungeon/DungeonRun.ts";
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

export const movePlayer = (
	game: GameState,
	direction: MovementDirection,
): GameState => {
	const run = moveDungeonRun(game.run, direction);
	if (run === game.run) return game;
	return { ...game, run, turn: game.turn + 1 };
};
