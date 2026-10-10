import type { ActivityEvent } from "../../domain/game/ActivityHistory.ts";
import { MONSTER_VISUALS } from "../monsters/MonsterVisuals.ts";

export const formatActivityEvent = (event: ActivityEvent): string => {
	const prefix = `Turn ${event.turn} — `;
	switch (event.type) {
		case "player-hit":
			return `${prefix}You hit the ${MONSTER_VISUALS[event.monster].label} for ${event.damage} damage.`;
		case "monster-hit":
			return `${prefix}The ${MONSTER_VISUALS[event.monster].label} hits you for ${event.damage} damage.`;
		case "monster-died":
			return `${prefix}The ${MONSTER_VISUALS[event.monster].label} dies.`;
		case "player-died":
			return `${prefix}You die.`;
	}
};
