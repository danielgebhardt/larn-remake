import { ITEM_DEFINITIONS, type ItemInstance } from "./Item";

export const BAG_CAPACITY = 27;
// Bound physical copies independently of occupied slots for imported saves.
export const MAX_BAG_ITEMS = 10000;
export type Bag = Readonly<{ items: readonly ItemInstance[] }>;
export type BagSlot = Readonly<{ item: ItemInstance; count: number }>;

export const bagSlots = (bag: Bag): readonly BagSlot[] => {
	const slots: { item: ItemInstance; count: number }[] = [];
	const potions = new Map<string, number>();
	for (const item of bag.items) {
		const index =
			ITEM_DEFINITIONS[item.kind].type === "potion"
				? potions.get(item.kind)
				: undefined;
		if (index !== undefined) slots[index].count++;
		else {
			if (ITEM_DEFINITIONS[item.kind].type === "potion")
				potions.set(item.kind, slots.length);
			slots.push({ item, count: 1 });
		}
	}
	return slots;
};
export const canAddToBag = (bag: Bag, item: ItemInstance): boolean =>
	bag.items.length < MAX_BAG_ITEMS &&
	(bagSlots(bag).length < BAG_CAPACITY ||
		(ITEM_DEFINITIONS[item.kind].type === "potion" &&
			bag.items.some((copy) => copy.kind === item.kind)));

export const createBag = (items: readonly ItemInstance[] = []): Bag => {
	if (items.length > MAX_BAG_ITEMS || bagSlots({ items }).length > BAG_CAPACITY)
		throw new Error(`A bag can hold at most ${BAG_CAPACITY} occupied slots.`);
	if (new Set(items.map((item) => item.id)).size !== items.length)
		throw new Error("The same item cannot occupy multiple bag slots.");
	return { items: [...items] };
};
export const createStartingBag = (): Bag => createBag();
