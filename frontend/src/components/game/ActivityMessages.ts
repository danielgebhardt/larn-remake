import type { ActivityEvent } from "../../domain/game/ActivityHistory.ts";
import { SPELL_DEFINITIONS } from "../../domain/game/Spells";
import { EQUIPMENT_SLOT_LABELS } from "../../domain/items/Equipment";
import { ITEM_DEFINITIONS } from "../../domain/items/Item";
import { MONSTER_DEFINITIONS } from "../../domain/monsters/Monster";

export const formatActivityEvent = (event: ActivityEvent): string => {
	const prefix = `Turn ${event.turn} — `;
	switch (event.type) {
		case "attribute-gained":
			return `${prefix}${event.attribute} increases to ${event.value}.`;
		case "experience-gained":
			return `${prefix}You gain ${event.amount} XP.`;
		case "level-gained":
			return `${prefix}You reach level ${event.level}. Maximum and current health increase by ${event.healthGain}.`;
		case "quest-completed":
			return `${prefix}You return with the cure. Adventure complete!`;
		case "entrance-reminder":
			return `${prefix}The cure is still on floor ${event.goalFloor}. Return with it to leave.`;
		case "floor-changed":
			return `${prefix}You ${event.toFloor > event.fromFloor ? "descend" : "ascend"} to floor ${event.toFloor}.`;
		case "monster-missed":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name} misses you.`;
		case "player-missed":
			return `${prefix}You miss the ${MONSTER_DEFINITIONS[event.monster].name}.`;
		case "spell-hit":
			return `${prefix}Your ${SPELL_DEFINITIONS[event.spell].name} hits the ${MONSTER_DEFINITIONS[event.monster].name} for ${event.damage} damage.`;
		case "player-hit":
			return `${prefix}You hit the ${MONSTER_DEFINITIONS[event.monster].name} for ${event.damage} damage.`;
		case "monster-hit":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name} hits you for ${event.damage} damage.`;
		case "monster-died":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name} dies.`;
		case "player-died":
			return `${prefix}You die.`;
		case "item-equipped": {
			const slot = EQUIPMENT_SLOT_LABELS[event.slot].toLowerCase();
			const replaced = event.replaced
				? `, returning ${ITEM_DEFINITIONS[event.replaced].name} to your bag`
				: "";
			return `${prefix}You equip ${ITEM_DEFINITIONS[event.item].name} in your ${slot}${replaced}.`;
		}
		case "item-unequipped":
			return `${prefix}You put ${ITEM_DEFINITIONS[event.item].name} in your bag.`;
		case "item-picked-up":
			if (event.item === "cure")
				return `${prefix}You recover the cure. Return to the entrance on floor 1.`;
			return `${prefix}You pick up ${ITEM_DEFINITIONS[event.item].name}.`;
		case "item-dropped":
			return `${prefix}You drop ${ITEM_DEFINITIONS[event.item].name}.`;
		case "monster-loot":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name} drops ${ITEM_DEFINITIONS[event.item].name}.`;
		case "item-consumed":
			return `${prefix}You drink ${ITEM_DEFINITIONS[event.item].name} and recover ${event.recovered} health.`;
		case "items-seen":
			return `${prefix}You see ${new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(event.items.map((item) => ITEM_DEFINITIONS[item].name))} here.`;
	}
};
