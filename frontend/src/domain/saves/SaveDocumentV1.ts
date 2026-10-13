import type { DungeonFloor } from "../dungeon/DungeonRun";
import type { Coordinate } from "../dungeon/DungeonTypes";
import type {
	FogConfiguration,
	RunConfiguration,
} from "../dungeon/RunConfiguration";
import type { ActivityHistory } from "../game/ActivityHistory";
import type { QuestState } from "../game/Adventure";
import type { PlayerStats } from "../game/PlayerStats";
import type { Progression } from "../game/Progression";
import type { SpellKind } from "../game/Spells";
import type { ItemInstance } from "../items/Item";
import type { PotionHotbar } from "../items/PotionHotbar";
import type { Monster } from "../monsters/Monster";

export type SavedItemV1 = Pick<ItemInstance, "id" | "kind">;

// Select persisted fields explicitly: adding GameState or Monster fields must
// not silently redefine v1. Required new runtime state needs a versioned adapter.
type SavedFloorV1 = Pick<
	DungeonFloor,
	"floorNumber" | "partitions" | "rooms" | "corridors" | "upStair" | "downStair"
> & { terrain: string[] };
type SavedMonsterV1 = Pick<
	Monster,
	"id" | "kind" | "floorNumber" | "coordinate" | "health"
>;
export type SaveDocumentV1 = {
	version: 1;
	savedAt: string;
	configuration: RunConfiguration;
	fog: FogConfiguration;
	state: {
		run: {
			seed: number;
			activeFloor: number;
			playerCoordinate: Coordinate;
			floors: SavedFloorV1[];
		};
		turn: number;
		mana: number;
		knownSpells: readonly SpellKind[];
		quest: QuestState;
		monstersDefeated: number;
		player: PlayerStats;
		progression: Progression;
		equipment: Readonly<
			Record<"mainHand" | "offHand" | "chest" | "head", SavedItemV1 | null>
		>;
		bag: Readonly<{ items: readonly SavedItemV1[] }>;
		potionHotbar: PotionHotbar;
		floorItems: readonly {
			item: SavedItemV1;
			floorNumber: number;
			coordinate: Coordinate;
		}[];
		monsters: readonly SavedMonsterV1[];
		activityHistory: ActivityHistory;
	};
	explored: { floorNumber: number; rows: string[] }[];
};
