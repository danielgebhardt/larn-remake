import { MAX_SIZE } from "./LayoutTiles";

export type RunConfiguration = {
	rows: number;
	cols: number;
	floorCount: number;
};
export type ConfigurationField = keyof RunConfiguration;
export type ConfigurationDraft = Record<ConfigurationField, string>;
export type ConfigurationErrors = Partial<Record<ConfigurationField, string>>;

export const DEFAULT_RUN_CONFIGURATION: RunConfiguration = {
	rows: 30,
	cols: 100,
	floorCount: 3,
};
export const CONFIGURATION_LIMITS = {
	rows: { min: 5, max: MAX_SIZE },
	cols: { min: 5, max: MAX_SIZE },
	floorCount: { min: 1, max: 10 },
};

export const configurationDraft = (
	value: RunConfiguration,
): ConfigurationDraft => ({
	rows: String(value.rows),
	cols: String(value.cols),
	floorCount: String(value.floorCount),
});

export const parseRunConfiguration = (
	draft: ConfigurationDraft,
):
	| { valid: true; value: RunConfiguration }
	| { valid: false; errors: ConfigurationErrors } => {
	const errors: ConfigurationErrors = {};
	const value: RunConfiguration = {
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
