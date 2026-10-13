import { ITEM_DEFINITIONS, type ItemInstance, type ItemKind } from "./Item";
export const MAX_ENCHANTMENT = 3;
export const isEnchantableKind = (kind: ItemKind): boolean =>
	["weapon", "shield", "chest-armor", "helmet"].includes(
		ITEM_DEFINITIONS[kind].type,
	);
export const itemAttackBonus = (
	item: ItemInstance | null | undefined,
): number =>
	item
		? ITEM_DEFINITIONS[item.kind].attackBonus +
			(ITEM_DEFINITIONS[item.kind].type === "weapon"
				? (item.enchantment ?? 0)
				: 0)
		: 0;
export const itemArmor = (item: ItemInstance | null | undefined): number =>
	item
		? ITEM_DEFINITIONS[item.kind].armor +
			(isEnchantableKind(item.kind) &&
			ITEM_DEFINITIONS[item.kind].type !== "weapon"
				? (item.enchantment ?? 0)
				: 0)
		: 0;
export const itemName = (item: ItemInstance): string =>
	`${ITEM_DEFINITIONS[item.kind].name}${item.enchantment ? ` +${item.enchantment}` : ""}`;
