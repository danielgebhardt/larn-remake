// A reproducible, omniscient diagnostic walker, not a player AI or a win-rate test.
// Run from frontend: node scripts/review-adventure.mjs
import { createServer } from "vite";

const server = await createServer({
	configFile: false,
	server: { middlewareMode: true, hmr: false, ws: false },
	optimizeDeps: { noDiscovery: true, entries: [] },
	appType: "custom",
});
try {
	const { generateDungeonRun, connectDungeonFloors } =
		await server.ssrLoadModule("/src/domain/dungeon/DungeonRun.ts");
	const { DEFAULT_RUN_CONFIGURATION } = await server.ssrLoadModule(
		"/src/domain/dungeon/RunConfiguration.ts",
	);
	const { createGameState } = await server.ssrLoadModule(
		"/src/domain/game/GameState.ts",
	);
	const { resolvePlayerAction } = await server.ssrLoadModule(
		"/src/domain/game/PlayerActions.ts",
	);
	const { equipmentSlotFor } = await server.ssrLoadModule(
		"/src/domain/items/Equipment.ts",
	);
	const { ITEM_DEFINITIONS } = await server.ssrLoadModule(
		"/src/domain/items/Item.ts",
	);
	const steps = [
		["up", -1, 0],
		["right", 0, 1],
		["down", 1, 0],
		["left", 0, -1],
	];
	const same = (a, b) => a.row === b.row && a.col === b.col;
	const key = (p) => `${p.row}:${p.col}`;
	// Avoid incidental stair transitions while routing to loot or a monster.
	function route(floor, start, target) {
		const queue = [{ point: start, path: [] }];
		const seen = new Set([key(start)]);
		for (let index = 0; index < queue.length; index++) {
			const { point, path } = queue[index];
			if (same(point, target)) return path;
			for (const [direction, dr, dc] of steps) {
				const next = { row: point.row + dr, col: point.col + dc };
				if (floor.terrain[next.row]?.[next.col] !== "." || seen.has(key(next)))
					continue;
				if (
					!same(next, target) &&
					[floor.upStair?.coordinate, floor.downStair?.coordinate].some(
						(stair) => stair && same(stair, next),
					)
				)
					continue;
				seen.add(key(next));
				queue.push({ point: next, path: [...path, direction] });
			}
		}
		return null;
	}
	const seeds = process.argv.slice(2).map(Number);
	for (const seed of seeds.length ? seeds : [0, 1, 123, 987]) {
		let state = createGameState(
			connectDungeonFloors(
				generateDungeonRun(seed, 5, DEFAULT_RUN_CONFIGURATION),
			),
		);
		const initial = {
			monsters: state.monsters.map((monster) => ({
				floor: monster.floorNumber,
				kind: monster.kind,
			})),
			loot: state.floorItems.map((entry) => ({
				floor: entry.floorNumber,
				kind: entry.item.kind,
			})),
		};
		let kills = 0;
		let potions = 0;
		const visited = new Set([1]);
		let reason = "step limit";
		for (let iteration = 0; iteration < 500; iteration++) {
			if (state.player.health <= 0) {
				reason = "died";
				break;
			}
			const floor = state.run.floors[state.run.activeFloor - 1];
			const position = state.run.playerCoordinate;
			const active = state.monsters.filter(
				(monster) =>
					monster.floorNumber === floor.floorNumber && monster.health > 0,
			);
			const ground = state.floorItems.filter(
				(entry) => entry.floorNumber === floor.floorNumber,
			);
			let action;
			const healing = state.bag.items.find(
				(item) => item.kind === "healing-potion",
			);
			const upgrade = state.bag.items.find((item) => {
				const slot = equipmentSlotFor(item);
				if (!slot) return false;
				const current = state.equipment[slot];
				const value = (definition) => definition.attackBonus + definition.armor;
				return (
					!current ||
					value(ITEM_DEFINITIONS[item.kind]) >
						value(ITEM_DEFINITIONS[current.kind])
				);
			});
			if (healing && state.player.health <= 6) {
				action = { type: "consume", itemId: healing.id };
				potions++;
			} else if (upgrade)
				action = {
					type: "equip",
					itemId: upgrade.id,
					slot: equipmentSlotFor(upgrade),
				};
			else {
				const adjacent = active.find(
					(monster) =>
						Math.abs(monster.coordinate.row - position.row) +
							Math.abs(monster.coordinate.col - position.col) ===
						1,
				);
				const here = ground.find((entry) => same(entry.coordinate, position));
				if (adjacent)
					action = {
						type: "move",
						direction: route(floor, position, adjacent.coordinate)?.[0],
					};
				else if (here && state.bag.items.length < 20)
					action = { type: "pickup", itemId: here.item.id };
				else {
					const targets = [
						...active.map((monster) => monster.coordinate),
						...(state.bag.items.length < 20
							? ground.map((entry) => entry.coordinate)
							: []),
					];
					const paths = targets
						.map((target) => route(floor, position, target))
						.filter((path) => path?.length)
						.sort((a, b) => a.length - b.length);
					const path =
						paths[0] ??
						(floor.downStair
							? route(floor, position, floor.downStair.coordinate)
							: null);
					if (!path?.length) {
						reason =
							floor.floorNumber === 5 ? "cleared final floor" : "no route";
						break;
					}
					action = { type: "move", direction: path[0] };
				}
			}
			const before = state.monsters.length;
			state = resolvePlayerAction(state, action).state;
			kills += before - state.monsters.length;
			visited.add(state.run.activeFloor);
		}
		console.log(
			JSON.stringify({
				seed,
				reason,
				deepest: Math.max(...visited),
				turns: state.turn,
				health: state.player.health,
				kills,
				potions,
				equipment: Object.fromEntries(
					Object.entries(state.equipment).map(([slot, item]) => [
						slot,
						item?.kind ?? null,
					]),
				),
				initial,
			}),
		);
	}
} finally {
	await server.close();
}
