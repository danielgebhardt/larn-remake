import type { Coordinate } from "../dungeon/DungeonTypes";
import { hasLineOfSight } from "../dungeon/Visibility";
import type { GameState } from "../game/GameState";
import { MONSTER_DEFINITIONS, type Monster } from "./Monster";
import { orthogonalDistance } from "./MonsterLocations";
import { detectsPlayer } from "./MonsterPursuit";
import { pursuitRulesFor } from "./PursuitRules";
export const MAX_ALARM_RECIPIENTS = 6;
// Broadcast only memory. Conditions, intent, occupancy and phase ordering remain owned by their existing resolvers.
export const alertNearbyMonsters = (
	state: GameState,
	source: Monster,
	actors: readonly Monster[],
	target: Coordinate,
): readonly Monster[] => {
	const radius = MONSTER_DEFINITIONS[source.kind].alarmRadius;
	if (!radius) return actors;
	const rules = pursuitRulesFor(state),
		terrain = state.run.floors[state.run.activeFloor - 1].terrain;
	const recipients = actors
		.filter(
			(actor) =>
				actor.id !== source.id &&
				actor.floorNumber === source.floorNumber &&
				actor.health > 0 &&
				orthogonalDistance(actor.coordinate, source.coordinate) <= radius &&
				hasLineOfSight(terrain, source.coordinate, actor.coordinate) &&
				!detectsPlayer(state.run, actor, rules),
		)
		.sort((a, b) => Number(a.id.split(":")[1]) - Number(b.id.split(":")[1]))
		.slice(0, MAX_ALARM_RECIPIENTS);
	if (!recipients.length) return actors;
	const ids = new Set(recipients.map((actor) => actor.id));
	return actors.map((actor) =>
		ids.has(actor.id)
			? {
					...actor,
					awareness: {
						type: "pursuing" as const,
						target: { ...target },
						remaining: rules.memoryPhases,
						blocked: 0,
					},
				}
			: actor,
	);
};
