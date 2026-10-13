import type { ActivityEntry, ActivityHistory } from "./ActivityHistory";
import { isPlayerDamage } from "./PlayerDamageEvents";
export const defeatRecap = (
	history: ActivityHistory,
	currentTurn: number,
): readonly ActivityEntry[] => {
	const death = history.entries.findLast(
		(entry) => entry.event.type === "player-died",
	);
	const turn = death?.event.turn ?? currentTurn;
	return history.entries
		.filter(
			(entry) =>
				(death === undefined || entry.id < death.id) &&
				entry.event.turn <= turn &&
				entry.event.turn >= Math.max(0, turn - 4) &&
				isPlayerDamage(entry.event),
		)
		.slice(-5);
};
