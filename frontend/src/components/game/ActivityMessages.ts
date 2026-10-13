import type { ActivityEvent } from "../../domain/game/ActivityHistory.ts";
import { SPELL_DEFINITIONS } from "../../domain/game/Spells";
import { EFFECT_DEFINITIONS } from "../../domain/game/TimedEffects";
import { EQUIPMENT_SLOT_LABELS } from "../../domain/items/Equipment";
import { ITEM_DEFINITIONS } from "../../domain/items/Item";
import { MONSTER_DEFINITIONS } from "../../domain/monsters/Monster";
import { OBJECT_DEFINITIONS } from "../../domain/objects/DungeonObject";
import { describeObject } from "../../domain/objects/ObjectDescriptions";

export const formatActivityEvent = (event: ActivityEvent): string => {
	const prefix = `Turn ${event.turn} — `;
	switch (event.type) {
		case "monster-awareness-changed":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name} ${event.awareness === "pursuing" ? "spots you and begins pursuit." : event.awareness === "searching" ? "searches its last known position." : "gives up the search."}`;
		case "discovery-opened":
			return `${prefix}You open the ${OBJECT_DEFINITIONS[event.kind].name}.${event.damage ? ` The seal deals ${event.damage} damage.` : ""} ${ITEM_DEFINITIONS[event.item].name} remains on the floor for G pickup.`;
		case "object-seen":
			return `${prefix}${describeObject(event)}`;
		case "shrine-offered":
			return `${prefix}You offer ${event.gold} gold at the shrine of insight. Its blessing is spent.`;
		case "throne-wound":
			return `${prefix}The throne wounds you for ${event.damage} damage.`;
		case "throne-used":
			return `${prefix}${{ blessing: "The throne grants lasting experience.", recovery: "The throne restores up to 8 health and 6 mana.", curse: "The throne curses you with poison.", relocation: "The throne carries you to a safe room tile on this floor.", treasure: "You pry loose the throne’s treasure.", wound: "The throne punishes your greed." }[event.outcome]} Its power is spent.`;
		case "fountain-restored":
			return `${prefix}The fountain restores ${event.health} health and ${event.mana} mana. It runs dry.`;
		case "fountain-poisoned":
			return `${prefix}The risky draw deals ${event.damage} damage. The fountain runs dry.`;
		case "trap-disarmed":
			return `${prefix}You disarm the trap.`;
		case "trap-sprung":
			return `${prefix}The trap springs for ${event.damage} damage.`;
		case "chest-opened":
			return `${prefix}You open the chest. ${ITEM_DEFINITIONS[event.item].name} is on the floor; walk onto it and press G to pick it up.`;
		case "gold-collected":
			return `${prefix}You collect ${event.amount} gold.`;
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
		case "monster-shot-missed":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name}'s shot misses you.`;
		case "monster-shot-hit":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name} shoots you for ${event.damage} damage.`;
		case "monster-prepared":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name} prepares a heavy attack at your tile. Move away to dodge.`;
		case "monster-heavy-hit":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name}'s heavy attack hits you for ${event.damage} damage.`;
		case "monster-heavy-missed":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name}'s heavy attack misses you.`;
		case "monster-heavy-avoided":
			return `${prefix}You avoid the ${MONSTER_DEFINITIONS[event.monster].name}'s heavy attack.`;
		case "player-missed":
			return `${prefix}You miss the ${MONSTER_DEFINITIONS[event.monster].name}.`;
		case "player-condition-hit":
			return `${prefix}${EFFECT_DEFINITIONS[event.condition].name} deals ${event.damage} damage to you.`;
		case "player-condition-applied":
			if (event.condition === "poisoned")
				return `${prefix}You are poisoned for ${event.duration} committed turns.`;
			return `${prefix}You gain ${EFFECT_DEFINITIONS[event.condition].name} for ${event.duration} committed turns.`;
		case "condition-hit":
			return `${prefix}${EFFECT_DEFINITIONS[event.condition].name} deals ${event.damage} damage to the ${MONSTER_DEFINITIONS[event.monster].name}.`;
		case "condition-applied":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name} is ${EFFECT_DEFINITIONS[event.condition].name.toLowerCase()} for ${event.duration} active phases.`;
		case "spell-repositioned":
			return `${prefix}${SPELL_DEFINITIONS[event.spell].name} ${event.monster ? `sends the ${MONSTER_DEFINITIONS[event.monster].name} farther away.` : "moves you to a nearby tile."}`;
		case "monster-regenerated":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name} regenerates ${event.recovered} health. Damage interrupts its recovery.`;
		case "monster-spell-hit":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name} casts ${SPELL_DEFINITIONS[event.spell].name} for ${event.damage} damage. Physical armor does not block magic.`;
		case "monster-spell-healed":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name} casts ${SPELL_DEFINITIONS[event.spell].name} and recovers ${event.recovered} health.`;
		case "monster-resisted":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name} resists ${event.element}; the hit deals ${event.damage} damage.`;
		case "monster-vulnerable":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name} is vulnerable to ${event.element}; the hit deals ${event.damage} damage.`;
		case "monster-area-prepared":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name} prepares a ${event.element} blast. Leave the marked area within ${event.remaining} turns.`;
		case "monster-area-hit":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name}'s ${event.element} blast hits you for ${event.damage} damage.`;
		case "monster-area-blocked":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name}’s ${event.element} blast is blocked by a wall or closed door.`;
		case "monster-area-avoided":
			return `${prefix}You escape the ${MONSTER_DEFINITIONS[event.monster].name}'s ${event.element} blast.`;
		case "door-changed":
			return `${prefix}You ${event.opened ? "open" : "close"} the door.`;
		case "spell-healed":
			return `${prefix}${SPELL_DEFINITIONS[event.spell].name} restores ${event.recovered} health.`;
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
			if (ITEM_DEFINITIONS[event.item].type === "spellbook")
				return `${prefix}You read ${ITEM_DEFINITIONS[event.item].name} and learn its spell.`;
			if (event.item === "cure")
				return `${prefix}You recover the cure. Return to the entrance on floor 1.`;
			return `${prefix}You pick up ${ITEM_DEFINITIONS[event.item].name}.`;
		case "item-dropped":
			return `${prefix}You drop ${ITEM_DEFINITIONS[event.item].name}.`;
		case "monster-loot":
			return `${prefix}The ${MONSTER_DEFINITIONS[event.monster].name} drops ${ITEM_DEFINITIONS[event.item].name}.`;
		case "item-cleansed":
			return `${prefix}You drink ${ITEM_DEFINITIONS[event.item].name} and remove poison.`;
		case "item-consumed": {
			const item = ITEM_DEFINITIONS[event.item];
			return `${prefix}You drink ${item.name} and recover ${event.recovered} ${"recovery" in item ? item.recovery.resource : "health"}.`;
		}
		case "items-seen":
			return `${prefix}You see ${new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(event.items.map((item) => ITEM_DEFINITIONS[item].name))} here.`;
	}
};
