export const DIFFICULTY_PRESETS = {
	easier: { label: "Easier", multiplier: 0.75 },
	normal: { label: "Normal", multiplier: 1 },
	harder: { label: "Harder", multiplier: 1.25 },
} as const;
export type Difficulty =
	(typeof DIFFICULTY_PRESETS)[keyof typeof DIFFICULTY_PRESETS]["multiplier"];
export const isDifficulty = (value: unknown): value is Difficulty =>
	value === 0.75 || value === 1 || value === 1.25;
export const assertDifficulty: (value: number) => asserts value is Difficulty =
	(value) => {
		if (!isDifficulty(value))
			throw new RangeError(
				"Difficulty must be Easier (0.75), Normal (1), or Harder (1.25).",
			);
	};
// Preserve the original roll range/stream, then scale the landed raw value.
export const scaleEnemyValue = (
	value: number,
	difficulty: number = 1,
): number => {
	assertDifficulty(difficulty);
	if (!Number.isSafeInteger(value) || value < 1)
		throw new RangeError(
			"Enemy health/damage must be a positive safe integer.",
		);
	return Math.max(1, Math.round(value * difficulty));
};

export const difficultyLabel = (value: Difficulty) =>
	value === 0.75 ? "Easier" : value === 1.25 ? "Harder" : "Normal";
