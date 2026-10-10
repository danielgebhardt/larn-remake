import {
	type MovementDirection,
	moveDungeonRun,
} from "../dungeon/DungeonRun.ts";
import { MONSTER_DEFINITIONS, type Monster } from "../monsters/Monster.ts";
import { type ActivityEvent, appendActivityEvents } from "./ActivityHistory.ts";
import type { GameState } from "./GameState.ts";
import { DEFAULT_PLAYER_ATTACK_DAMAGE } from "./PlayerStats.ts";

export type PlayerAction = { type: "move"; direction: MovementDirection };

export type ActionResolution = {
	state: GameState;
	turnAdvanced: boolean;
};

export const resolvePlayerAction = (
	state: GameState,
	action: PlayerAction,
): ActionResolution => {
	if (state.player.health <= 0) return { state, turnAdvanced: false };
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
	if (monster) return resolveAttack(state, monster);
	return {
		state: { ...state, run, turn: state.turn + 1 },
		turnAdvanced: true,
	};
};

const resolveAttack = (
	state: GameState,
	monster: Monster,
): ActionResolution => {
	const turn = state.turn + 1;
	const health = Math.max(0, monster.health - DEFAULT_PLAYER_ATTACK_DAMAGE);
	const events: ActivityEvent[] = [
		{
			type: "player-hit",
			turn,
			monster: monster.kind,
			damage: DEFAULT_PLAYER_ATTACK_DAMAGE,
		},
	];
	let player = state.player;
	if (health > 0) {
		const damage = MONSTER_DEFINITIONS[monster.kind].attackDamage;
		player = { ...player, health: Math.max(0, player.health - damage) };
		events.push({ type: "monster-hit", turn, monster: monster.kind, damage });
		if (player.health === 0) events.push({ type: "player-died", turn });
	} else {
		events.push({ type: "monster-died", turn, monster: monster.kind });
	}
	const monsters =
		health > 0
			? state.monsters.map((actor) =>
					actor.id === monster.id ? { ...actor, health } : actor,
				)
			: state.monsters.filter((actor) => actor.id !== monster.id);
	return {
		state: {
			...state,
			turn,
			player,
			monsters,
			activityHistory: appendActivityEvents(state.activityHistory, events),
		},
		turnAdvanced: true,
	};
};
