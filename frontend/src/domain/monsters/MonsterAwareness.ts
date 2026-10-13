import type { DungeonRun } from "../dungeon/DungeonRun";
import type { Monster } from "./Monster";
import { orthogonalDistance } from "./MonsterLocations";
import { selectPursuitStep } from "./MonsterPursuit";
import { PURSUIT_RULES, type PursuitRules } from "./PursuitRules";

export const advanceUnseenPursuit = (
	run: DungeonRun,
	monster: Monster,
	actors: readonly Monster[],
	rules: Readonly<PursuitRules> = PURSUIT_RULES,
	rooted = false,
): Monster => {
	const memory = monster.awareness;
	if (!memory || memory.type === "idle") return monster;
	const idle = { ...monster, awareness: { type: "idle" as const } };
	if (memory.type === "searching")
		return memory.remaining <= 1
			? idle
			: {
					...monster,
					awareness: { ...memory, remaining: memory.remaining - 1 },
				};
	if (memory.remaining <= 0) return idle;
	if (orthogonalDistance(monster.coordinate, memory.target) === 0)
		return {
			...monster,
			awareness: {
				type: "searching",
				target: memory.target,
				remaining: rules.searchPhases,
			},
		};
	const coordinate = rooted
		? undefined
		: selectPursuitStep(run, monster, actors, memory.target, true);
	const remaining = memory.remaining - 1;
	const blocked = coordinate ? 0 : memory.blocked + (rooted ? 0 : 1);
	if (remaining === 0 || blocked >= rules.blockedPhases)
		return { ...idle, coordinate: coordinate ?? monster.coordinate };
	return {
		...monster,
		coordinate: coordinate ?? monster.coordinate,
		awareness:
			coordinate && orthogonalDistance(coordinate, memory.target) === 0
				? {
						type: "searching",
						target: memory.target,
						remaining: rules.searchPhases,
					}
				: { ...memory, remaining, blocked },
	};
};
