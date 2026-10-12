import type { Monster } from "../monsters/Monster";
import { appendActivityEvents } from "./ActivityHistory";
import type { GameState } from "./GameState";

export const EFFECT_DEFINITIONS = {
	slowed: { name: "Slowed", duration: 3 },
	rooted: { name: "Webbed", duration: 3 },
	asleep: { name: "Asleep", duration: 3 },
	afraid: { name: "Afraid", duration: 3 },
} as const;
export type EffectKind = keyof typeof EFFECT_DEFINITIONS;
export type TimedEffect = Readonly<{
	actorId: string;
	floorNumber: number;
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
	let changed = false;
	const effects: TimedEffect[] = [];
	for (const effect of state.effects) {
		if (
			!state.monsters.some(
				(actor) => actor.id === effect.actorId && actor.health > 0,
			)
		) {
			changed = true;
			continue;
		}
		if (effect.floorNumber !== state.run.activeFloor) {
			effects.push(effect);
			continue;
		}
		changed = true;
		if (effect.remaining > 1)
			effects.push({ ...effect, remaining: effect.remaining - 1 });
	}
	return changed ? { ...state, effects } : state;
};

export const hasMonsterEffect = (
	state: GameState,
	monster: Monster,
	kind: EffectKind,
): boolean =>
	state.effects.some(
		(effect) => effect.actorId === monster.id && effect.kind === kind,
	);
