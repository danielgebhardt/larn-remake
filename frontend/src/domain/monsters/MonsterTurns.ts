import {
	type ActivityEvent,
	appendActivityEvents,
} from "../game/ActivityHistory";
import type { GameState } from "../game/GameState";
import { MONSTER_DEFINITIONS } from "./Monster";
import { orthogonalDistance } from "./MonsterLocations";
import { detectsPlayer, selectPursuitStep } from "./MonsterPursuit";

// The player phase has already chosen the active floor and turn number.
export const resolveMonsterPhase = (state: GameState): GameState => {
	let player = state.player;
	let monsters = state.monsters;
	const events: ActivityEvent[] = [];
	for (const monster of state.monsters) {
		if (player.health <= 0) break;
		if (monster.health <= 0 || monster.floorNumber !== state.run.activeFloor)
			continue;
		if (!detectsPlayer(state.run, monster)) continue;
		if (
			orthogonalDistance(monster.coordinate, state.run.playerCoordinate) !== 1
		) {
			const coordinate = selectPursuitStep(state.run, monster, monsters);
			if (coordinate)
				monsters = monsters.map((actor) =>
					actor.id === monster.id ? { ...actor, coordinate } : actor,
				);
			continue;
		}
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
	if (events.length === 0 && monsters === state.monsters) return state;
	return {
		...state,
		player,
		monsters,
		activityHistory: appendActivityEvents(state.activityHistory, events),
	};
};
