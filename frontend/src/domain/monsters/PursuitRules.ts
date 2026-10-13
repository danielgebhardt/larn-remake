export type PursuitRules = {
	detectionBonus: number;
	memoryPhases: number;
	searchPhases: number;
	blockedPhases: number;
};
// Counts are eligible active monster phases, not global turns or wall-clock time.
export const PURSUIT_RULES: Readonly<PursuitRules> = {
	detectionBonus: 0,
	memoryPhases: 12,
	searchPhases: 3,
	blockedPhases: 3,
};
