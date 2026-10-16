import { type DungeonRun, hashStringToUint32 } from "../dungeon/DungeonRun";
import { createSeededRandom } from "../dungeon/Seed";
import type { Monster } from "../monsters/Monster";
import type { FloorItem } from "./FloorItems";
import { ITEM_DEFINITIONS, type ItemKind } from "./Item";
import { availableItemLocations } from "./ItemPlacement";

export const selectedRunSpellbooks = (run: DungeonRun): readonly ItemKind[] => {
	const pool = (Object.keys(ITEM_DEFINITIONS) as ItemKind[]).filter((kind) => {
		const definition = ITEM_DEFINITIONS[kind];
		return (
			definition.type === "spellbook" &&
			definition.minFloor <= run.floors.length
		);
	});
	const choose = createSeededRandom(
		hashStringToUint32(`${run.seed}:spellbooks:selection`),
	);
	const countRandom = createSeededRandom(
		hashStringToUint32(`${run.seed}:spellbooks:count`),
	);
	const count = Math.min(pool.length, 3 + Math.floor(countRandom() * 4));
	const selected: ItemKind[] = [];
	for (let index = 0; index < count; index++) {
		const [kind] = pool.splice(Math.floor(choose() * pool.length), 1);
		selected.push(kind);
	}
	return selected;
};

export const spawnRunSpellbooks = (
	run: DungeonRun,
	monsters: readonly Monster[],
	occupied: readonly FloorItem[],
): readonly FloorItem[] => {
	const books: FloorItem[] = [];
	for (const kind of selectedRunSpellbooks(run)) {
		const definition = ITEM_DEFINITIONS[kind];
		const floorRandom = createSeededRandom(
			hashStringToUint32(`${run.seed}:spellbook:${kind}:floor`),
		);
		const maxFloor = Math.min(definition.maxFloor, run.floors.length);
		const floorNumber =
			definition.minFloor +
			Math.floor(floorRandom() * (maxFloor - definition.minFloor + 1));
		const floor = run.floors[floorNumber - 1];
		const candidates = availableItemLocations(run, floor, monsters, [
			...occupied,
			...books,
		]);
		if (!candidates.length) continue;
		const tileRandom = createSeededRandom(
			hashStringToUint32(`${run.seed}:${floorNumber}:spellbook:${kind}:tile`),
		);
		books.push({
			item: { id: `floor:${floorNumber}:book:${kind}`, kind },
			floorNumber,
			coordinate: candidates[Math.floor(tileRandom() * candidates.length)],
		});
	}
	return books;
};
