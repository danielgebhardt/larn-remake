import type { ItemInstance } from "./Item";

export const BAG_CAPACITY = 20;
export type Bag = Readonly<{ items: readonly ItemInstance[] }>;

export const createBag = (items: readonly ItemInstance[] = []): Bag => {
	if (items.length > BAG_CAPACITY)
		throw new Error(`A bag can hold at most ${BAG_CAPACITY} items.`);
	if (new Set(items.map((item) => item.id)).size !== items.length)
		throw new Error("The same item cannot occupy multiple bag slots.");
	return { items: [...items] };
};

export const createStartingBag = (): Bag =>
	createBag([
		{ id: "starting:bag:1", kind: "iron-sword" },
		{ id: "starting:bag:2", kind: "wooden-shield" },
	]);
