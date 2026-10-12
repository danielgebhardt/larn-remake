import type { Monster } from "../monsters/Monster";
import { appendActivityEvents } from "./ActivityHistory";
import type { GameState } from "./GameState";
import { damageMonster } from "./MonsterDamage";

export const EFFECT_DEFINITIONS = {
	slowed: { name: "Slowed", duration: 3 },
	rooted: { name: "Webbed", duration: 3 },
	asleep: { name: "Asleep", duration: 3 },
	afraid: { name: "Afraid", duration: 3 },
	poisoned: { name: "Poisoned", duration: 3 },
	renewing: { name: "Renewal", duration: 4 },
} as const;
export type EffectKind = keyof typeof EFFECT_DEFINITIONS;
export type TimedEffect = Readonly<{
	actorId: string;
	floorNumber: number | null;
	kind: EffectKind;
	remaining: number;
}>;
export const applyTimedEffect = (
	state: GameState,
	monster: Monster,
	kind: EffectKind,
): GameState => ({
	...state,
	monsters:
		kind === "asleep" || kind === "afraid"
			? state.monsters.map((actor) =>
					actor.id === monster.id
						? { ...actor, intent: { type: "idle" } }
						: actor,
				)
			: state.monsters,
	effects: [
		...state.effects.filter(
			(effect) => effect.actorId !== monster.id || effect.kind !== kind,
		),
		{
			actorId: monster.id,
			floorNumber: monster.floorNumber,
			kind,
			remaining: EFFECT_DEFINITIONS[kind].duration,
		},
	],
	activityHistory: appendActivityEvents(state.activityHistory, [
		{
			type: "condition-applied",
			monster: monster.kind,
			condition: kind,
			duration: EFFECT_DEFINITIONS[kind].duration,
			turn: state.turn,
		},
	]),
});
export const monsterSkipsAction = (
	state: GameState,
	monster: Monster,
): boolean =>
	state.effects.some(
		(effect) =>
			effect.actorId === monster.id &&
			(effect.kind === "asleep" ||
				(effect.kind === "slowed" && effect.remaining % 2 === 1)),
	);

// Only the action boundary calls this after a committed active-floor phase.
// Removing a killed actor also removes its effects; inactive actors retain timers.
export const advanceTimedEffects = (state: GameState): GameState => {
	let next = state;
	let changed = false;
	const effects: TimedEffect[] = [];
	// Stable actor order: monster poison before player Renewal, after retaliation.
	const ordered = [...state.effects].sort(
		(a, b) =>
			a.actorId.localeCompare(b.actorId, undefined, { numeric: true }) ||
			a.kind.localeCompare(b.kind),
	);
	for (const effect of ordered) {
		const isPlayer = effect.actorId === "player";
		const actor = isPlayer
			? undefined
			: next.monsters.find(
					(monster) => monster.id === effect.actorId && monster.health > 0,
				);
		if (!isPlayer && !actor) {
			changed = true;
			continue;
		}
		if (!isPlayer && effect.floorNumber !== state.run.activeFloor) {
			effects.push(effect);
			continue;
		}
		changed = true;
		if (next.player.health > 0 && effect.kind === "poisoned" && actor)
			next = damageMonster(next, actor, 2, {
				type: "condition-hit",
				condition: "poisoned",
			});
		if (next.player.health > 0 && isPlayer && effect.kind === "renewing") {
			const recovered = Math.min(2, next.player.maxHealth - next.player.health);
			if (recovered > 0)
				next = {
					...next,
					player: { ...next.player, health: next.player.health + recovered },
					activityHistory: appendActivityEvents(next.activityHistory, [
						{
							type: "spell-healed",
							spell: "renewal",
							recovered,
							turn: next.turn,
						},
					]),
				};
		}
		if (
			effect.remaining > 1 &&
			(isPlayer ||
				next.monsters.some((monster) => monster.id === effect.actorId))
		)
			effects.push({ ...effect, remaining: effect.remaining - 1 });
	}
	return changed ? { ...next, effects } : state;
};

export const applyPlayerRenewal = (state: GameState): GameState => ({
	...state,
	activityHistory: appendActivityEvents(state.activityHistory, [
		{
			type: "player-condition-applied",
			condition: "renewing",
			duration: EFFECT_DEFINITIONS.renewing.duration,
			turn: state.turn,
		},
	]),
	effects: [
		...state.effects.filter(
			(effect) => effect.actorId !== "player" || effect.kind !== "renewing",
		),
		{
			actorId: "player",
			floorNumber: null,
			kind: "renewing",
			remaining: EFFECT_DEFINITIONS.renewing.duration,
		},
	],
});

export const hasMonsterEffect = (
	state: GameState,
	monster: Monster,
	kind: EffectKind,
): boolean =>
	state.effects.some(
		(effect) => effect.actorId === monster.id && effect.kind === kind,
	);
