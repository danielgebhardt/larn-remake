import { appendActivityEvents } from "../game/ActivityHistory";
import type { GameState } from "../game/GameState";
import { createBag, removeBagItem } from "./Bag";
import { EQUIPMENT_SLOT_LABELS, type EquipmentSlot } from "./Equipment";
import type { ItemInstance } from "./Item";
import { isEnchantableKind, MAX_ENCHANTMENT } from "./ItemValues";
export type EnchantAction = {
	type: "enchant";
	scrollId: string;
	targetItemId: string;
};
export const enchantmentTargets = (
	state: Pick<GameState, "equipment" | "bag">,
): readonly { item: ItemInstance; location: string }[] =>
	[
		...Object.entries(state.equipment).flatMap(([slot, item]) =>
			item
				? [{ item, location: EQUIPMENT_SLOT_LABELS[slot as EquipmentSlot] }]
				: [],
		),
		...state.bag.items.map((item) => ({ item, location: "Bag" })),
	].filter(
		({ item }) =>
			isEnchantableKind(item.kind) && (item.enchantment ?? 0) < MAX_ENCHANTMENT,
	);
export const enchantEquipment = (
	state: GameState,
	action: EnchantAction,
): GameState | { error: string } => {
	const scroll = state.bag.items.find(
		(i) => i.id === action.scrollId && i.kind === "enchantment-scroll",
	);
	if (!scroll) return { error: "That enchantment scroll is not in your bag." };
	const target = [...Object.values(state.equipment), ...state.bag.items].find(
		(i) => i?.id === action.targetItemId,
	);
	if (!target || !isEnchantableKind(target.kind))
		return { error: "Choose an owned weapon, shield, chest piece or helmet." };
	if ((target.enchantment ?? 0) >= MAX_ENCHANTMENT)
		return { error: "That equipment is already enchanted to +3." };
	const enhanced = { ...target, enchantment: (target.enchantment ?? 0) + 1 };
	const equipment = { ...state.equipment };
	for (const slot of Object.keys(equipment) as EquipmentSlot[])
		if (equipment[slot]?.id === target.id) equipment[slot] = enhanced;
	return {
		...state,
		equipment,
		bag: createBag(
			removeBagItem(state.bag, scroll.id).items.map((i) =>
				i.id === target.id ? enhanced : i,
			),
		),
		activityHistory: appendActivityEvents(state.activityHistory, [
			{
				type: "equipment-enchanted",
				item: target.kind,
				enchantment: enhanced.enchantment,
				turn: state.turn,
			},
		]),
	};
};
