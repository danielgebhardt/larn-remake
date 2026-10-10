import {
	type ActivityEvent,
	appendActivityEvents,
} from "../game/ActivityHistory";
import type { GameState } from "../game/GameState";
import { MONSTER_DEFINITIONS } from "./Monster";

// The player phase has already chosen the active floor and turn number.
export const resolveMonsterPhase = (state: GameState): GameState => {
	let player = state.player;
	const events: ActivityEvent[] = [];
	for (const monster of state.monsters) {
		if (player.health <= 0) break;
		if (monster.health <= 0 || monster.floorNumber !== state.run.activeFloor)
			continue;
		const distance =
			Math.abs(monster.coordinate.row - state.run.playerCoordinate.row) +
			Math.abs(monster.coordinate.col - state.run.playerCoordinate.col);
		if (distance !== 1) continue;
		const damage = MONSTER_DEFINITIONS[monster.kind].attackDamage;
		player = { ...player, health: Math.max(0, player.health - damage) };
		events.push({
			type: "monster-hit",
			turn: state.turn,
			monster: monster.kind,
			damage,
		});
		if (player.health === 0)
			events.push({ type: "player-died", turn: state.turn });
	}
	if (events.length === 0) return state;
	return {
		...state,
		player,
		activityHistory: appendActivityEvents(state.activityHistory, events),
	};
};
