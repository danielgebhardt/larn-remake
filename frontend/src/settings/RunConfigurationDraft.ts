import {
	CONFIGURATION_LIMITS,
	DEFAULT_RUN_CONFIGURATION,
	type RunConfiguration,
} from "../domain/dungeon/RunConfiguration.ts";
import { isDifficulty } from "../domain/game/Difficulty";

export type ConfigurationField = "rows" | "cols" | "floorCount" | "difficulty";
export type ConfigurationDraft = Record<
	Exclude<ConfigurationField, "difficulty">,
	string
> & { difficulty?: string };
export type ConfigurationErrors = Partial<Record<ConfigurationField, string>>;

export const configurationDraft = (
	value: RunConfiguration,
): ConfigurationDraft => ({
	rows: String(value.rows),
	cols: String(value.cols),
	floorCount: String(value.floorCount),
	difficulty: String(value.difficulty ?? 1),
});

export const parseRunConfiguration = (
	draft: ConfigurationDraft,
	configuration: RunConfiguration = DEFAULT_RUN_CONFIGURATION,
):
	| { valid: true; value: RunConfiguration }
	| { valid: false; errors: ConfigurationErrors } => {
	const errors: ConfigurationErrors = {};
	const difficulty = Number(draft.difficulty ?? configuration.difficulty ?? 1);
	if (!isDifficulty(difficulty))
		errors.difficulty = "Choose Easier, Normal, or Harder.";
	const value: RunConfiguration = {
		...configuration,
		difficulty: isDifficulty(difficulty) ? difficulty : 1,
		rows: Number(draft.rows.trim()),
		cols: Number(draft.cols.trim()),
		floorCount: Number(draft.floorCount.trim()),
	};
	for (const field of ["rows", "cols", "floorCount"] as const) {
		const input = draft[field].trim();
		const number = value[field];
		const { min, max } = CONFIGURATION_LIMITS[field];
		if (
			!/^\d+$/.test(input) ||
			!Number.isInteger(number) ||
			number < min ||
			number > max
		)
			errors[field] = `Enter a whole number from ${min} to ${max}.`;
	}
	return Object.keys(errors).length
		? { valid: false, errors }
		: { valid: true, value };
};
