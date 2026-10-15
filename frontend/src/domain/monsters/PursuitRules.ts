import type { GameState } from "../game/GameState";

export type PursuitRules = {
	detectionBonus: number;
	memoryPhases: number;
	searchPhases: number;
	blockedPhases: number;
	cureSenseRadius?: number;
};
// Counts are eligible active monster phases, not global turns or wall-clock time.
export const PURSUIT_RULES: Readonly<PursuitRules> = {
	detectionBonus: 0,
	memoryPhases: 12,
	searchPhases: 3,
	blockedPhases: 3,
};

export const ESCAPE_PURSUIT_RULES: Readonly<PursuitRules> = {
	cureSenseRadius: 24,
	detectionBonus: 2,
	memoryPhases: 18,
	searchPhases: 4,
	blockedPhases: 3,
};
export const pursuitRulesFor = (
	state: Pick<GameState, "escape" | "quest">,
): Readonly<PursuitRules> =>
	state.escape && state.quest.cureRecovered && !state.quest.victory
		? ESCAPE_PURSUIT_RULES
		: PURSUIT_RULES;
