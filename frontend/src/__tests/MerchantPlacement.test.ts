// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
	connectDungeonFloors,
	generateDungeonRun,
} from "../domain/dungeon/DungeonRun";
import { createGameState } from "../domain/game/GameState";
import {
	merchantFloors,
	placeMerchants,
} from "../domain/merchant/MerchantPlacement";
import {
	coordinateKey,
	protectedFloorLocations,
} from "../domain/monsters/MonsterLocations";
import { sealedEliteTiles } from "../domain/objects/OptionalEliteRooms";
import { COMPACT_TEST_CONFIGURATION } from "./TestRunConfiguration";

describe("Wandering merchant placement", () => {
	it.each([
		[5, []],
		[10, [5]],
		[15, [5, 10]],
		[20, [5, 10, 15]],
		[13, [5, 10]],
	])("uses every fifth floor below a %i-floor goal", (count, expected) =>
		expect(merchantFloors(count as number)).toEqual(expected),
	);
	it("is deterministic, reachable, collision free and idempotent without changing stock", () => {
		const state = createGameState(
			connectDungeonFloors(
				generateDungeonRun(123, 20, COMPACT_TEST_CONFIGURATION),
			),
		);
		const objects = placeMerchants(state, true);
		expect(placeMerchants(state, true)).toEqual(objects);
		expect(placeMerchants({ ...state, objects }, true)).toEqual(objects);
		const vendors = objects.filter((o) => o.kind === "merchant");
		expect(vendors.map((o) => o.floorNumber)).toEqual([5, 10, 15]);
		for (const vendor of vendors) {
			const floor = state.run.floors[vendor.floorNumber - 1];
			expect(
				floor.rooms.some(
					(r) =>
						vendor.coordinate.row >= r.startRow &&
						vendor.coordinate.row <= r.endRow &&
						vendor.coordinate.col >= r.startCol &&
						vendor.coordinate.col <= r.endCol,
				),
			).toBe(true);
			expect(
				protectedFloorLocations(state.run, vendor.floorNumber),
			).not.toContainEqual(vendor.coordinate);
			expect(
				sealedEliteTiles(floor, objects).has(coordinateKey(vendor.coordinate)),
			).toBe(false);
			expect(
				[
					...state.monsters,
					...state.floorItems,
					...state.objects.filter((o) => o.kind !== "merchant"),
				].some(
					(e) =>
						e.floorNumber === vendor.floorNumber &&
						coordinateKey(e.coordinate) === coordinateKey(vendor.coordinate),
				),
			).toBe(false);
		}
		expect(state.merchantStock["mana-potion"]).toBe(10);
	});
	it("does not place new vendors when disabled and preserves stored locations", () => {
		const state = createGameState(
			connectDungeonFloors(
				generateDungeonRun(123, 10, COMPACT_TEST_CONFIGURATION),
			),
		);
		const ordinary = {
			...state,
			objects: state.objects.filter((o) => o.kind !== "merchant"),
		};
		expect(placeMerchants(ordinary, false)).toBe(ordinary.objects);
		expect(placeMerchants(state, false)).toBe(state.objects);
	});
});
