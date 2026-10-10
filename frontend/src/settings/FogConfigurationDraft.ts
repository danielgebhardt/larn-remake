import { FOG_RADIUS_LIMITS } from "../domain/dungeon/RunConfiguration.ts";

export const parseFogRadius = (draft: string): number | undefined => {
	const input = draft.trim();
	const radius = Number(input);
	return /^\d+$/.test(input) &&
		Number.isInteger(radius) &&
		radius >= FOG_RADIUS_LIMITS.min &&
		radius <= FOG_RADIUS_LIMITS.max
		? radius
		: undefined;
};
