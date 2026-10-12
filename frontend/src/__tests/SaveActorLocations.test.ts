// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseSave, serializeSave } from "../domain/saves/SaveFormat";
import { savedAdventure } from "./SaveTestHelpers";

describe("Saved actors preserve safe stair arrivals", () => {
	it.each([
		{ name: "first-floor down stair", floor: 1, stair: "downStair" },
		{ name: "middle-floor up stair", floor: 2, stair: "upStair" },
		{ name: "middle-floor down stair", floor: 2, stair: "downStair" },
		{ name: "last-floor up stair", floor: 5, stair: "upStair" },
	] as const)("rejects a monster on the $name", ({ floor, stair }) => {
		const document = savedAdventure();
		const link = document.state.run.floors[floor - 1][stair];
		if (!link) throw new Error("Fixture requires the named stair");
		document.state.monsters = [
			{
				intent: { type: "idle" as const },
				id: `${floor}:1`,
				kind: "goblin",
				floorNumber: floor,
				coordinate: link.coordinate,
				health: 4,
			},
		];
		expect(parseSave(serializeSave(document))).toEqual({
			ok: false,
			error: "This save contains inconsistent adventure data.",
		});
	});
	it("rejects a monster at the destination of a stair from another floor", () => {
		const document = savedAdventure();
		const down = document.state.run.floors[0].downStair;
		if (!down) throw new Error("Fixture requires a down stair");
		document.state.monsters = [
			{
				intent: { type: "idle" as const },
				id: "2:1",
				kind: "goblin",
				floorNumber: down.destinationFloor,
				coordinate: down.arrivalCoordinate,
				health: 4,
			},
		];
		expect(parseSave(serializeSave(document)).ok).toBe(false);
	});
	it("allows a monster beside stairs and the player on a stair arrival", () => {
		const document = savedAdventure();
		const floor = document.state.run.floors[1];
		const up = floor.upStair;
		if (!up) throw new Error("Fixture requires an up stair");
		const neighbours = [
			{ row: up.coordinate.row - 1, col: up.coordinate.col },
			{ row: up.coordinate.row + 1, col: up.coordinate.col },
			{ row: up.coordinate.row, col: up.coordinate.col - 1 },
			{ row: up.coordinate.row, col: up.coordinate.col + 1 },
		];
		const beside = neighbours.find(
			(point) =>
				floor.terrain[point.row]?.[point.col] === "." &&
				!(
					point.row === floor.downStair?.coordinate.row &&
					point.col === floor.downStair?.coordinate.col
				),
		);
		if (!beside) throw new Error("Fixture requires a floor tile beside stairs");
		document.state.run.activeFloor = 2;
		document.state.run.playerCoordinate = up.coordinate;
		document.state.monsters = [
			{
				intent: { type: "idle" as const },
				id: "2:1",
				kind: "goblin",
				floorNumber: 2,
				coordinate: beside,
				health: 4,
			},
		];
		expect(parseSave(serializeSave(document))).toEqual({
			ok: true,
			value: document,
		});
	});
});
