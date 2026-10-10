import type { ActivityEvent } from "../../domain/game/ActivityHistory.ts";
import { ITEM_DEFINITIONS } from "../../domain/items/Item";
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
		case "item-equipped": {
			const slot = event.slot === "mainHand" ? "main hand" : "off hand";
			const replaced = event.replaced
				? `, returning ${ITEM_DEFINITIONS[event.replaced].name} to your bag`
				: "";
			return `${prefix}You equip ${ITEM_DEFINITIONS[event.item].name} in your ${slot}${replaced}.`;
		}
		case "item-unequipped":
			return `${prefix}You put ${ITEM_DEFINITIONS[event.item].name} in your bag.`;
		case "item-picked-up":
			return `${prefix}You pick up ${ITEM_DEFINITIONS[event.item].name}.`;
		case "item-dropped":
			return `${prefix}You drop ${ITEM_DEFINITIONS[event.item].name}.`;
		case "monster-loot":
			return `${prefix}The ${MONSTER_VISUALS[event.monster].label} drops ${ITEM_DEFINITIONS[event.item].name}.`;
		case "item-consumed":
			return `${prefix}You drink ${ITEM_DEFINITIONS[event.item].name} and recover ${event.recovered} health.`;
		case "items-seen":
			return `${prefix}You see ${new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(event.items.map((item) => ITEM_DEFINITIONS[item].name))} here.`;
	}
};
