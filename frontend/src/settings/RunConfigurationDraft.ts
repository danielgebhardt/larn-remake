import {
	CONFIGURATION_LIMITS,
	DEFAULT_RUN_CONFIGURATION,
	type RunConfiguration,
} from "../domain/dungeon/RunConfiguration.ts";

export type ConfigurationField = "rows" | "cols" | "floorCount";
export type ConfigurationDraft = Record<ConfigurationField, string>;
export type ConfigurationErrors = Partial<Record<ConfigurationField, string>>;

export const configurationDraft = (
	value: RunConfiguration,
): ConfigurationDraft => ({
	rows: String(value.rows),
	cols: String(value.cols),
	floorCount: String(value.floorCount),
});

export const parseRunConfiguration = (
	draft: ConfigurationDraft,
	configuration: RunConfiguration = DEFAULT_RUN_CONFIGURATION,
):
	| { valid: true; value: RunConfiguration }
	| { valid: false; errors: ConfigurationErrors } => {
	const errors: ConfigurationErrors = {};
	const value: RunConfiguration = {
		...configuration,
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
