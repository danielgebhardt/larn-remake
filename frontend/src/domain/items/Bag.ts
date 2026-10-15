import { ITEM_DEFINITIONS, type ItemInstance } from "./Item";

export const BAG_CAPACITY = 27;
// Bound physical copies independently of occupied slots for imported saves.
export const MAX_BAG_ITEMS = 10000;
export type Bag = Readonly<{ items: readonly ItemInstance[] }>;
export type BagSlot = Readonly<{ item: ItemInstance; count: number }>;

const isStackable = (item: ItemInstance): boolean =>
	["potion", "enchantment"].includes(ITEM_DEFINITIONS[item.kind].type);

// A stack keeps its UI identity when its representative physical copy changes.
export const bagItemKey = (item: ItemInstance): string =>
	isStackable(item) ? `stack:${item.kind}` : `item:${item.id}`;

export const bagSlots = (bag: Bag): readonly BagSlot[] => {
	const slots: { item: ItemInstance; count: number }[] = [];
	const stacks = new Map<string, number>();
	for (const item of bag.items) {
		const index = isStackable(item) ? stacks.get(item.kind) : undefined;
		if (index !== undefined) slots[index].count++;
		else {
			if (isStackable(item)) stacks.set(item.kind, slots.length);
			slots.push({ item, count: 1 });
		}
	}
	return slots;
};
export const canAddToBag = (bag: Bag, item: ItemInstance): boolean =>
	bag.items.length < MAX_BAG_ITEMS &&
	(bagSlots(bag).length < BAG_CAPACITY ||
		(isStackable(item) && bag.items.some((copy) => copy.kind === item.kind)));

export const createBag = (items: readonly ItemInstance[] = []): Bag => {
	if (items.length > MAX_BAG_ITEMS || bagSlots({ items }).length > BAG_CAPACITY)
		throw new Error(`A bag can hold at most ${BAG_CAPACITY} occupied slots.`);
	if (new Set(items.map((item) => item.id)).size !== items.length)
		throw new Error("The same item cannot occupy multiple bag slots.");
	return { items: [...items] };
};
export const createStartingBag = (): Bag =>
	createBag([
		{ id: "starting:healing-potion", kind: "healing-potion" },
		{ id: "starting:mana-potion", kind: "mana-potion" },
	]);

export const removeBagItem = (bag: Bag, itemId: string): Bag => {
	const index = bag.items.findIndex((item) => item.id === itemId);
	if (index === -1) return bag;
	const removed = bag.items[index];
	const items = bag.items.filter((item) => item.id !== itemId);
	if (
		isStackable(removed) &&
		bag.items.find((item) => item.kind === removed.kind)?.id === itemId
	) {
		const nextIndex = items.findIndex((item) => item.kind === removed.kind);
		if (nextIndex !== -1) {
			// Carry the stack's existing position forward without retaining an empty slot.
			const [next] = items.splice(nextIndex, 1);
			items.splice(index, 0, next);
		}
	}
	return createBag(items);
};
