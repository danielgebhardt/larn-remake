import type { DungeonRun } from "../dungeon/DungeonRun.ts";
import { type Bag, createStartingBag } from "../items/Bag";
import { spawnRunQuestItems } from "../items/CurePlacement";
import { createStartingEquipment, type Equipment } from "../items/Equipment";
import type { FloorItem } from "../items/FloorItems";
import { spawnRunItems } from "../items/ItemPlacement";
import { createPotionHotbar, type PotionHotbar } from "../items/PotionHotbar";
import { spawnRunSpellbooks } from "../items/SpellbookPlacement";
import type { Monster } from "../monsters/Monster.ts";
import { spawnRunMonsters } from "../monsters/MonsterPlacement.ts";
import type { DungeonObject } from "../objects/DungeonObject";
import { spawnRunObjects } from "../objects/ObjectPlacement";
import {
	type ActivityHistory,
	createActivityHistory,
} from "./ActivityHistory.ts";
import { createQuest, type QuestState } from "./Adventure";
import type { EscapeState } from "./Escape";
import { maximumMana } from "./Mana";
import { createPlayerStats, type PlayerStats } from "./PlayerStats.ts";
import { createProgression, type Progression } from "./Progression";
import { createSpellHotbar, type SpellHotbar } from "./SpellHotbar";
import { createKnownSpells, type SpellKind } from "./Spells";
import type { TimedEffect } from "./TimedEffects";

export type GameState = {
	escape: EscapeState | null;
	run: DungeonRun;
	objects: readonly DungeonObject[];
	gold: number;
	turn: number;
	mana: number;
	knownSpells: readonly SpellKind[];
	spellHotbar: SpellHotbar;
	effects: readonly TimedEffect[];
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
	const ordinaryLoot = spawnRunItems(run, monsters);
	const loot = [
		...ordinaryLoot,
		...spawnRunQuestItems(run, monsters, ordinaryLoot),
	];
	const floorItems = [...loot, ...spawnRunSpellbooks(run, monsters, loot)];
	return {
		run,
		escape: null,
		objects: spawnRunObjects(run, monsters, floorItems),
		gold: 0,
		turn: 0,
		knownSpells: createKnownSpells(),
		spellHotbar: createSpellHotbar(createKnownSpells()),
		effects: [],
		mana: maximumMana(createProgression()),
		quest: createQuest(run),
		monstersDefeated: 0,
		player: createPlayerStats(),
		progression: createProgression(),
		equipment: createStartingEquipment(),
		bag: createStartingBag(),
		potionHotbar: createPotionHotbar(),
		floorItems,
		monsters,
		activityHistory: createActivityHistory(),
	};
};
