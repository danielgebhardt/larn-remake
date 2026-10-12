import { EFFECT_DEFINITIONS } from "../game/TimedEffects";
import type { SaveDocumentV5 } from "./SaveDocumentV5";
import { isSaveDocumentV4 } from "./SaveShapeV4";
export const isSaveDocumentV5 = (value: unknown): value is SaveDocumentV5 => {
	if (
		typeof value !== "object" ||
		value === null ||
		!("version" in value) ||
		value.version !== 5 ||
		!isSaveDocumentV4({ ...value, version: 4 }) ||
		!("state" in value) ||
		typeof value.state !== "object" ||
		value.state === null ||
		!("effects" in value.state)
	)
		return false;
	const effects = value.state.effects;
	return (
		Array.isArray(effects) &&
		effects.length <= 1000 &&
		effects.every(
			(effect) =>
				typeof effect === "object" &&
				effect !== null &&
				typeof effect.actorId === "string" &&
				effect.actorId.length > 0 &&
				effect.actorId.length <= 200 &&
				(effect.floorNumber === null ||
					(Number.isInteger(effect.floorNumber) &&
						effect.floorNumber >= 1 &&
						effect.floorNumber <= 20)) &&
				typeof effect.kind === "string" &&
				Object.hasOwn(EFFECT_DEFINITIONS, effect.kind) &&
				Number.isInteger(effect.remaining) &&
				effect.remaining >= 1 &&
				effect.remaining <=
					EFFECT_DEFINITIONS[effect.kind as keyof typeof EFFECT_DEFINITIONS]
						.duration,
		)
	);
};
