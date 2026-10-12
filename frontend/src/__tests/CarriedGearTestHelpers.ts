import { createBag } from "../domain/items/Bag";

/** Spare gear for transfer tests; new adventures start with an empty bag. */
export const bagWithSpareGear = () =>
	createBag([
		{ id: "carried:sword", kind: "iron-sword" },
		{ id: "carried:shield", kind: "wooden-shield" },
	]);
