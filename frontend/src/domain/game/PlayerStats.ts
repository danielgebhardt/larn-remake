export type PlayerStats = {
	health: number;
	maxHealth: number;
};

export const DEFAULT_PLAYER_MAX_HEALTH = 10;

export const createPlayerStats = (): PlayerStats => ({
	health: DEFAULT_PLAYER_MAX_HEALTH,
	maxHealth: DEFAULT_PLAYER_MAX_HEALTH,
});
