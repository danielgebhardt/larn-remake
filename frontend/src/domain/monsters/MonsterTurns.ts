import {
	type ActivityEvent,
	appendActivityEvents,
} from "../game/ActivityHistory";
import {
	type AttackRollSource,
	createAttackRolls,
} from "../game/CombatRandomness";
import { deriveCombatStats } from "../game/CombatStats";
import type { GameState } from "../game/GameState";
import {
	attackProfile,
	deriveAccuracy,
	resolveMeleeAttack,
} from "../game/MeleeRules";
import {
	EFFECT_DEFINITIONS,
	hasMonsterEffect,
	monsterSkipsAction,
	refreshPlayerEffect,
} from "../game/TimedEffects";
import { MONSTER_DEFINITIONS } from "./Monster";
import { orthogonalDistance } from "./MonsterLocations";
import { detectsPlayer, selectPursuitStep } from "./MonsterPursuit";
import { selectRetreatStep } from "./MonsterRetreat";

// The player phase has already chosen the active floor and turn number.
export const resolveMonsterPhase = (
	state: GameState,
	rollSource: AttackRollSource = createAttackRolls,
): GameState => {
	if (state.quest.victory) return state;
	let player = state.player;
	let monsters = state.monsters;
	let effects = state.effects;
	const events: ActivityEvent[] = [];
	const { armor } = deriveCombatStats(
		state.equipment,
		state.progression,
		state.effects,
	);
	const { monsterHitThreshold } = deriveAccuracy(
		state.progression,
		state.effects,
		state.equipment,
	);
	// IDs encode floor:spawnIndex; sort numeric indices, not incidental storage order.
	const active = state.monsters
		.filter(
			(monster) =>
				monster.health > 0 && monster.floorNumber === state.run.activeFloor,
		)
		.sort((a, b) => Number(a.id.split(":")[1]) - Number(b.id.split(":")[1]));
	for (const snapshot of active) {
		let monster = snapshot;
		if (player.health <= 0) break;
		const profile = MONSTER_DEFINITIONS[monster.kind];
		if (
			profile.regeneration &&
			(monster.lastDamagedTurn == null ||
				monster.lastDamagedTurn < state.turn - 1)
		) {
			const recovered = Math.min(
				profile.regeneration,
				profile.maxHealth - monster.health,
			);
			if (recovered > 0) {
				monster = { ...monster, health: monster.health + recovered };
				monsters = monsters.map((actor) =>
					actor.id === monster.id ? monster : actor,
				);
				events.push({
					type: "monster-regenerated",
					monster: monster.kind,
					recovered,
					turn: state.turn,
				});
			}
		}
		if (monsterSkipsAction(state, monster)) continue;
		const interval = MONSTER_DEFINITIONS[monster.kind].actionInterval ?? 1;
		if (state.turn % interval !== 0) continue;
		if (hasMonsterEffect(state, monster, "afraid")) {
			const coordinate = hasMonsterEffect(state, monster, "rooted")
				? undefined
				: selectRetreatStep(state.run, monster, monsters);
			if (coordinate)
				monsters = monsters.map((actor) =>
					actor.id === monster.id ? { ...actor, coordinate } : actor,
				);
			continue;
		}
		// Both attack range and prepared-target adjacency use Manhattan distance.
		const distance = orthogonalDistance(
			monster.coordinate,
			state.run.playerCoordinate,
		);
		const definition = MONSTER_DEFINITIONS[monster.kind];
		const preparing = monster.intent.type === "preparing-attack";
		if (monster.intent.type === "preparing-attack") {
			// Resolve the old target even after the player leaves detection.
			// Clearing intent consumes this phase; no pursuit or retarget follows.
			monsters = monsters.map((actor) =>
				actor.id === monster.id
					? { ...actor, intent: { type: "idle" } }
					: actor,
			);
			if (
				distance !== 1 ||
				orthogonalDistance(
					monster.intent.target,
					state.run.playerCoordinate,
				) !== 0
			) {
				events.push({
					type: "monster-heavy-avoided",
					turn: state.turn,
					monster: monster.kind,
				});
				continue;
			}
		} else {
			if (!detectsPlayer(state.run, monster)) continue;
			if (definition.preparesAttack && distance === 1) {
				const target = { ...state.run.playerCoordinate };
				monsters = monsters.map((actor) =>
					actor.id === monster.id
						? { ...actor, intent: { type: "preparing-attack", target } }
						: actor,
				);
				events.push({
					type: "monster-prepared",
					turn: state.turn,
					monster: monster.kind,
					target,
				});
				continue;
			}
		}
		const shooting =
			!preparing &&
			definition.rangedAttackRange !== undefined &&
			distance >= 2 &&
			distance <= definition.rangedAttackRange;
		if (distance !== 1 && !shooting) {
			const coordinate = hasMonsterEffect(state, monster, "rooted")
				? undefined
				: selectPursuitStep(state.run, monster, monsters);
			if (coordinate)
				monsters = monsters.map((actor) =>
					actor.id === monster.id ? { ...actor, coordinate } : actor,
				);
			continue;
		}
		const outcome = resolveMeleeAttack(
			attackProfile(definition.attackDamage, monsterHitThreshold),
			rollSource({
				seed: state.run.seed,
				floorNumber: state.run.activeFloor,
				turn: state.turn,
				attackerId: preparing
					? `${monster.id}:heavy`
					: shooting
						? `${monster.id}:shot`
						: monster.id,
				targetId: "player",
			}),
			armor,
		);
		if (!outcome.hit) {
			events.push({
				type: preparing
					? "monster-heavy-missed"
					: shooting
						? "monster-shot-missed"
						: "monster-missed",
				turn: state.turn,
				monster: monster.kind,
			});
			continue;
		}
		const damage = outcome.damage;
		player = { ...player, health: Math.max(0, player.health - damage) };
		events.push({
			type: preparing
				? "monster-heavy-hit"
				: shooting
					? "monster-shot-hit"
					: "monster-hit",
			turn: state.turn,
			monster: monster.kind,
			damage,
		});
		if (player.health > 0 && definition.onHitCondition) {
			effects = refreshPlayerEffect(effects, definition.onHitCondition);
			events.push({
				type: "player-condition-applied",
				condition: definition.onHitCondition,
				duration: EFFECT_DEFINITIONS[definition.onHitCondition].duration,
				turn: state.turn,
			});
		}
		if (player.health === 0)
			events.push({ type: "player-died", turn: state.turn });
	}
	if (events.length === 0 && monsters === state.monsters) return state;
	return {
		...state,
		player,
		monsters,
		effects,
		activityHistory: appendActivityEvents(state.activityHistory, events),
	};
};
