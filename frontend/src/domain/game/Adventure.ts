import { selectPlayerStart } from "../dungeon/DungeonLocations";
import type { DungeonRun } from "../dungeon/DungeonRun";
import type { Coordinate } from "../dungeon/DungeonTypes";

export type VictorySummary = Readonly<{
	seed: number;
	floors: number;
	turns: number;
	monstersDefeated: number;
	gold?: number;
	health: number;
	level: number;
	experience: number;
}>;
export type QuestState = Readonly<{
	goalFloor: number;
	entrance: Coordinate;
	cureRecovered: boolean;
	victory: VictorySummary | null;
}>;
export const createQuest = (run: DungeonRun): QuestState => ({
	goalFloor: run.floors.length,
	entrance: {
		...(run.activeFloor === 1
			? run.playerCoordinate
			: selectPlayerStart(run.floors[0])),
	},
	cureRecovered: false,
	victory: null,
});

export const questInstruction = (quest: QuestState): string =>
	quest.victory
		? "Ember returned. The beacon burns again."
		: quest.cureRecovered
			? "Hunted return: Return to the entrance on floor 1."
			: `Recover the last ember on floor ${quest.goalFloor}.`;
