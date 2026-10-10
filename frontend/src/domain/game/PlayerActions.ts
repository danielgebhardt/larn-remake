import {
	type MovementDirection,
	moveDungeonRun,
} from "../dungeon/DungeonRun.ts";
import type { Monster } from "../monsters/Monster.ts";
import { resolveMonsterPhase } from "../monsters/MonsterTurns";
import { type ActivityEvent, appendActivityEvents } from "./ActivityHistory.ts";
import { deriveCombatStats } from "./CombatStats";
import type { GameState } from "./GameState.ts";

export type PlayerAction =
	| { type: "move"; direction: MovementDirection }
	| { type: "wait" };

export type ActionResolution = {
	state: GameState;
	turnAdvanced: boolean;
};

export const resolvePlayerAction = (
	state: GameState,
	action: PlayerAction,
): ActionResolution => {
	if (state.player.health <= 0) return { state, turnAdvanced: false };
	if (action.type === "wait")
		return {
			state: resolveMonsterPhase({ ...state, turn: state.turn + 1 }),
			turnAdvanced: true,
		};
	// Movement validates collision and applies at most one stair transition.
	// An occupied destination resolves combat from the original position instead.
	// Spawn placement excludes stairs and their arrival tiles.
	const run = moveDungeonRun(state.run, action.direction);
	if (run === state.run) return { state, turnAdvanced: false };
	const monster = state.monsters.find(
		(monster) =>
			monster.floorNumber === state.run.activeFloor &&
			monster.floorNumber === run.activeFloor &&
			monster.health > 0 &&
			monster.coordinate.row === run.playerCoordinate.row &&
			monster.coordinate.col === run.playerCoordinate.col,
	);
	const playerResult = monster
		? resolveAttack(state, monster)
		: { ...state, run, turn: state.turn + 1 };
	return {
		state: resolveMonsterPhase(playerResult),
		turnAdvanced: true,
	};
};

const resolveAttack = (state: GameState, monster: Monster): GameState => {
	const turn = state.turn + 1;
	const damage = deriveCombatStats(state.equipment).attack;
	const health = Math.max(0, monster.health - damage);
	const events: ActivityEvent[] = [
		{
			type: "player-hit",
			turn,
			monster: monster.kind,
			damage,
		},
	];
	if (health === 0)
		events.push({ type: "monster-died", turn, monster: monster.kind });
	const monsters =
		health > 0
			? state.monsters.map((actor) =>
					actor.id === monster.id ? { ...actor, health } : actor,
				)
			: state.monsters.filter((actor) => actor.id !== monster.id);
	return {
		...state,
		turn,
		monsters,
		activityHistory: appendActivityEvents(state.activityHistory, events),
	};
};
