export const ATTRIBUTE_NAMES = [
	"strength",
	"dexterity",
	"intelligence",
] as const;
export type AttributeName = (typeof ATTRIBUTE_NAMES)[number];
export type PermanentAttributes = Readonly<Record<AttributeName, number>>;
// Numeric safety only; no reachable balance cap or diminishing potion reward.
export const MAX_PERMANENT_ATTRIBUTE_GAIN = Number.MAX_SAFE_INTEGER - 1024;
export const createPermanentAttributes = (): PermanentAttributes => ({
	strength: 0,
	dexterity: 0,
	intelligence: 0,
});
export const permanentAttributeGains = (progression: {
	permanentAttributes?: PermanentAttributes;
}): PermanentAttributes =>
	progression.permanentAttributes ?? createPermanentAttributes();
export const isPermanentAttributes = (
	value: unknown,
): value is PermanentAttributes => {
	if (typeof value !== "object" || value === null || Array.isArray(value))
		return false;
	const record = value as Record<string, unknown>;
	return (
		Object.keys(record).length === ATTRIBUTE_NAMES.length &&
		ATTRIBUTE_NAMES.every(
			(attribute) =>
				typeof record[attribute] === "number" &&
				Number.isSafeInteger(record[attribute]) &&
				Number(record[attribute]) >= 0 &&
				Number(record[attribute]) <= MAX_PERMANENT_ATTRIBUTE_GAIN,
		)
	);
};
