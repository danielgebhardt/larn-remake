import { FLOOR } from "../dungeon/Tiles";
import { hasLineOfSight } from "../dungeon/Visibility";
import type { Monster } from "../monsters/Monster";
import { orthogonalDistance } from "../monsters/MonsterLocations";
import { appendActivityEvents } from "./ActivityHistory";
import type { AttackRollSource } from "./CombatRandomness";
import type { GameState } from "./GameState";
import { damageMonster } from "./MonsterDamage";
import {
	SPELL_DEFINITIONS,
	type SpellKind,
	spellKnowledgeError,
	spellPotency,
} from "./Spells";

export type CastAction = { type: "cast"; spell: SpellKind; targetId?: string };
export const isSpellTarget = (state: GameState, monster: Monster): boolean => {
	const terrain = state.run.floors[state.run.activeFloor - 1].terrain;
	return (
		monster.health > 0 &&
		monster.floorNumber === state.run.activeFloor &&
		terrain[monster.coordinate.row]?.[monster.coordinate.col] === FLOOR &&
		orthogonalDistance(state.run.playerCoordinate, monster.coordinate) <=
			SPELL_DEFINITIONS["magic-missile"].range &&
		hasLineOfSight(terrain, state.run.playerCoordinate, monster.coordinate)
	);
};
// Apply spell effects on the turn already committed by action resolution.
export const castSpell = (
	state: GameState,
	action: CastAction,
	rolls: AttackRollSource,
): { state: GameState } | { error: string } => {
	const knowledgeError = spellKnowledgeError(state.knownSpells, action.spell);
	if (knowledgeError) return { error: knowledgeError };
	const definition = SPELL_DEFINITIONS[action.spell];
	if (state.mana < definition.cost)
		return {
			error: `Not enough mana for ${definition.name}. You need ${definition.cost}.`,
		};
	if (definition.mode === "self") {
		if (state.player.health >= state.player.maxHealth)
			return { error: "You are already at full health." };
		const recovered = Math.min(
			spellPotency(state.progression).healing,
			state.player.maxHealth - state.player.health,
		);
		const turn = state.turn;
		return {
			state: {
				...state,
				mana: state.mana - definition.cost,
				player: { ...state.player, health: state.player.health + recovered },
				activityHistory: appendActivityEvents(state.activityHistory, [
					{ type: "spell-healed", spell: action.spell, recovered, turn },
				]),
			},
		};
	}
	const target = state.monsters.find(
		(monster) => monster.id === action.targetId,
	);
	if (!target || !isSpellTarget(state, target))
		return {
			error:
				"Choose a living monster within range and clear line of sight on this floor.",
		};
	const potency = spellPotency(state.progression);
	const damage = rolls({
		seed: state.run.seed,
		floorNumber: state.run.activeFloor,
		turn: state.turn,
		attackerId: `player:spell:${action.spell}`,
		targetId: target.id,
	}).damage(potency.minimumDamage, potency.maximumDamage);
	return {
		state: damageMonster(
			{ ...state, mana: state.mana - definition.cost },
			target,
			damage,
			{
				type: "spell-hit",
				spell: action.spell,
			},
		),
	};
};
