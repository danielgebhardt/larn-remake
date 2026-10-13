import type { TimedEffect } from "./TimedEffects";

export const playerEffectBonuses = (effects: readonly TimedEffect[] = []) => {
	const has = (kind: TimedEffect["kind"]) =>
		effects.some(
			(effect) => effect.actorId === "player" && effect.kind === kind,
		);
	return {
		strength: has("strengthened") ? 2 : 0,
		intelligence: has("enlightened") ? 2 : 0,
		dexterity: has("nimble") ? 2 : 0,
		armor: has("protected") ? 2 : 0,
	};
};
