import { createMonsterDrop } from "../items/MonsterDrops";
import { MONSTER_DEFINITIONS, type Monster } from "../monsters/Monster";
import { type ActivityEvent, appendActivityEvents } from "./ActivityHistory";
import {
	dexterityAtLevel,
	intelligenceAtLevel,
	strengthAtLevel,
} from "./Attributes";
import type { GameState } from "./GameState";
import { growManaCapacity } from "./Mana";
import { gainExperience, HEALTH_PER_LEVEL } from "./Progression";
import type { SpellKind } from "./Spells";
import type { EffectKind } from "./TimedEffects";

type DamageSource =
	| { type: "player-hit" }
	| { type: "spell-hit"; spell: SpellKind }
	| { type: "condition-hit"; condition: EffectKind };

// Melee and spells share one confirmed damage/kill reward path.
export const damageMonster = (
	state: GameState,
	monster: Monster,
	damage: number,
	source: DamageSource,
): GameState => {
	const turn = state.turn;
	const health = Math.max(0, monster.health - damage);
	const events: ActivityEvent[] = [
		{ ...source, monster: monster.kind, damage, turn },
	];
	if (health === 0)
		events.push({ type: "monster-died", turn, monster: monster.kind });
	let floorItems = state.floorItems;
	let player = state.player;
	let progression = state.progression;
	let mana = state.mana;
	if (health === 0) {
		const reward = MONSTER_DEFINITIONS[monster.kind].experienceReward;
		const gained = gainExperience(progression, player, reward);
		progression = gained.progression;
		player = gained.player;
		mana = growManaCapacity(
			state.mana,
			state.progression,
			progression,
			state.equipment,
		);
		events.push({ type: "experience-gained", amount: reward, turn });
		for (const level of gained.levels) {
			events.push({
				type: "level-gained",
				level,
				healthGain: HEALTH_PER_LEVEL,
				turn,
			});
			if (strengthAtLevel(level) > strengthAtLevel(level - 1))
				events.push({
					type: "attribute-gained",
					attribute: "Strength",
					value: strengthAtLevel(level),
					turn,
				});
			if (intelligenceAtLevel(level) > intelligenceAtLevel(level - 1))
				events.push({
					type: "attribute-gained",
					attribute: "Intelligence",
					value: intelligenceAtLevel(level),
					turn,
				});
			if (dexterityAtLevel(level) > dexterityAtLevel(level - 1))
				events.push({
					type: "attribute-gained",
					attribute: "Dexterity",
					value: dexterityAtLevel(level),
					turn,
				});
		}
		const drop = createMonsterDrop(state.run.seed, monster);
		if (drop && !floorItems.some((entry) => entry.item.id === drop.item.id)) {
			floorItems = [...floorItems, drop];
			// Player attacks resolve on a visible target before the monster phase.
			events.push({
				type: "monster-loot",
				turn,
				monster: monster.kind,
				item: drop.item.kind,
			});
		}
	}
	const monsters =
		health > 0
			? state.monsters.map((actor) =>
					actor.id === monster.id
						? {
								...actor,
								health,
								...(MONSTER_DEFINITIONS[actor.kind].regeneration
									? { lastDamagedTurn: state.turn }
									: {}),
							}
						: actor,
				)
			: state.monsters.filter((actor) => actor.id !== monster.id);
	return {
		...state,
		monsters,
		effects: state.effects.some(
			(effect) =>
				effect.actorId === monster.id &&
				(health === 0 || (damage > 0 && effect.kind === "asleep")),
		)
			? state.effects.filter(
					(effect) =>
						effect.actorId !== monster.id ||
						(health > 0 && effect.kind !== "asleep"),
				)
			: state.effects,
		monstersDefeated: state.monstersDefeated + (health === 0 ? 1 : 0),
		player,
		progression,
		mana,
		floorItems,
		activityHistory: appendActivityEvents(state.activityHistory, events),
	};
};
