import type { ActivityEvent } from "../game/ActivityHistory";
import type { GameState } from "../game/GameState";
import { MONSTER_DEFINITIONS, type Monster } from "./Monster";
export const resolveMonsterAlarm = (
	state: GameState,
	monster: Monster,
	detected: boolean,
): { monster: Monster; events: ActivityEvent[] } | undefined => {
	if (!MONSTER_DEFINITIONS[monster.kind].alarmRadius || monster.alarmUsed)
		return undefined;
	if (monster.intent.type === "preparing-alarm")
		return {
			monster: { ...monster, alarmUsed: true, intent: { type: "idle" } },
			events: [
				{
					type: "monster-alarm-sounded",
					actorId: monster.id,
					monster: monster.kind,
					target: monster.intent.target,
					turn: state.turn,
				},
			],
		};
	if (monster.intent.type !== "idle" || !detected) return undefined;
	const target = { ...state.run.playerCoordinate };
	return {
		monster: { ...monster, intent: { type: "preparing-alarm", target } },
		events: [
			{
				type: "monster-alarm-prepared",
				actorId: monster.id,
				monster: monster.kind,
				target,
				turn: state.turn,
			},
		],
	};
};
