import type { DungeonRun } from "../dungeon/DungeonRun.ts";
import { type Bag, createStartingBag } from "../items/Bag";
import { createStartingEquipment, type Equipment } from "../items/Equipment";
import type { FloorItem } from "../items/FloorItems";
import type { Monster } from "../monsters/Monster.ts";
import { spawnRunMonsters } from "../monsters/MonsterPlacement.ts";
import {
	type ActivityHistory,
	createActivityHistory,
} from "./ActivityHistory.ts";
import { createPlayerStats, type PlayerStats } from "./PlayerStats.ts";

export type GameState = {
	run: DungeonRun;
	turn: number;
	player: PlayerStats;
	equipment: Equipment;
	bag: Bag;
	floorItems: readonly FloorItem[];
	monsters: readonly Monster[];
	activityHistory: ActivityHistory;
};

export const createGameState = (run: DungeonRun): GameState => ({
	run,
	turn: 0,
	player: createPlayerStats(),
	equipment: createStartingEquipment(),
	bag: createStartingBag(),
	floorItems: [],
	monsters: spawnRunMonsters(run),
	activityHistory: createActivityHistory(),
});
