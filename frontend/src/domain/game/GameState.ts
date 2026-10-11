import type { DungeonRun } from "../dungeon/DungeonRun.ts";
import { type Bag, createStartingBag } from "../items/Bag";
import { spawnRunQuestItems } from "../items/CurePlacement";
import { createStartingEquipment, type Equipment } from "../items/Equipment";
import type { FloorItem } from "../items/FloorItems";
import { spawnRunItems } from "../items/ItemPlacement";
import { createPotionHotbar, type PotionHotbar } from "../items/PotionHotbar";
import type { Monster } from "../monsters/Monster.ts";
import { spawnRunMonsters } from "../monsters/MonsterPlacement.ts";
import {
	type ActivityHistory,
	createActivityHistory,
} from "./ActivityHistory.ts";
import { createQuest, type QuestState } from "./Adventure";
import { maximumMana } from "./Mana";
import { createPlayerStats, type PlayerStats } from "./PlayerStats.ts";
import { createProgression, type Progression } from "./Progression";

export type GameState = {
	run: DungeonRun;
	turn: number;
	mana: number;
	quest: QuestState;
	monstersDefeated: number;
	player: PlayerStats;
	progression: Progression;
	equipment: Equipment;
	bag: Bag;
	potionHotbar: PotionHotbar;
	floorItems: readonly FloorItem[];
	monsters: readonly Monster[];
	activityHistory: ActivityHistory;
};

export const createGameState = (run: DungeonRun): GameState => {
	const monsters = spawnRunMonsters(run);
	const loot = spawnRunItems(run, monsters);
	return {
		run,
		turn: 0,
		mana: maximumMana(createProgression()),
		quest: createQuest(run),
		monstersDefeated: 0,
		player: createPlayerStats(),
		progression: createProgression(),
		equipment: createStartingEquipment(),
		bag: createStartingBag(),
		potionHotbar: createPotionHotbar(),
		floorItems: [...loot, ...spawnRunQuestItems(run, monsters, loot)],
		monsters,
		activityHistory: createActivityHistory(),
	};
};
