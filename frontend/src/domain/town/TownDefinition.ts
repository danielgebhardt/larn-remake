import type { Coordinate } from "../dungeon/DungeonTypes";

export const TOWN_LAYOUT_ID = "beacon-town:v1";

export type TownBuilding = Readonly<{
	id: string;
	name: string;
	sign: string;
	district: string;
	mark: string;
	row: number;
	col: number;
	width: number;
	height: number;
	entry: Readonly<Coordinate>;
	status: "open" | "closed";
}>;

const buildings: readonly TownBuilding[] = Object.freeze(
	[
		{
			id: "library",
			name: "Library",
			sign: "Library — the books outlast the librarians.",
			district: "Quiet Lane",
			mark: "L",
			row: 2,
			col: 2,
			width: 5,
			height: 3,
			entry: {
				row: 4,
				col: 4,
			},
		},
		{
			id: "sanctuary",
			name: "Sanctuary",
			sign: "Sanctuary — mercy will have a price.",
			district: "Quiet Lane",
			mark: "H",
			row: 2,
			col: 8,
			width: 5,
			height: 3,
			entry: {
				row: 4,
				col: 10,
			},
		},
		{
			id: "storage",
			name: "Storage courtyard",
			sign: "Storage — yours, once there is a lock worth trusting.",
			district: "Forge Court",
			mark: "C",
			row: 2,
			col: 18,
			width: 5,
			height: 3,
			entry: {
				row: 4,
				col: 20,
			},
		},
		{
			id: "forge",
			name: "Forge",
			sign: "Forge — currently less useful than its chimney.",
			district: "Forge Court",
			mark: "F",
			row: 2,
			col: 24,
			width: 3,
			height: 3,
			entry: {
				row: 4,
				col: 25,
			},
		},
		{
			id: "potions",
			name: "Potion store",
			sign: "Potions — the apothecary returned. The prices survived.",
			district: "Market Street",
			mark: "P",
			row: 14,
			col: 2,
			width: 5,
			height: 3,
			entry: {
				row: 14,
				col: 4,
			},
		},
		{
			id: "armor",
			name: "Armor store",
			sign: "Armor — protection sold separately from confidence.",
			district: "Market Street",
			mark: "A",
			row: 14,
			col: 8,
			width: 5,
			height: 3,
			entry: {
				row: 14,
				col: 10,
			},
		},
		{
			id: "weapons",
			name: "Weapon store",
			sign: "Weapons — every edge has a price.",
			district: "Market Street",
			mark: "W",
			row: 14,
			col: 16,
			width: 5,
			height: 3,
			entry: {
				row: 14,
				col: 18,
			},
		},
		{
			id: "scrolls",
			name: "Scroll shop",
			sign: "Scrolls — please do not test the stock near the beacon.",
			district: "Market Street",
			mark: "S",
			row: 14,
			col: 22,
			width: 5,
			height: 3,
			entry: {
				row: 14,
				col: 24,
			},
		},
		{
			id: "vault-plot",
			name: "Reserved vault plot",
			sign: "Reserved plot — a vault is proposed. Optimistic of them.",
			district: "South Approach",
			mark: "V",
			row: 18,
			col: 2,
			width: 5,
			height: 2,
			entry: {
				row: 18,
				col: 4,
			},
		},
		{
			id: "expansion-plot",
			name: "Reserved expansion plot",
			sign: "Reserved plot — room for another good intention.",
			district: "South Approach",
			mark: "?",
			row: 18,
			col: 22,
			width: 5,
			height: 2,
			entry: {
				row: 18,
				col: 24,
			},
		},
	].map((building) =>
		Object.freeze({
			...building,
			entry: Object.freeze(building.entry),
			status: ["potions", "armor", "weapons"].includes(building.id)
				? ("open" as const)
				: ("closed" as const),
		}),
	),
);

// Authored map, independent of dungeon seeds, generation settings and random streams.
// # wall, . ground, = paving, R roof, D closed threshold, B beacon, G dungeon gate.
const terrain = Object.freeze([
	"#############################",
	"#.............=.............#",
	"#.RRRRR.RRRRR.=...RRRRR.RRR.#",
	"#.RRRRR.RRRRR.=...RRRRR.RRR.#",
	"#.RRDRR.RRDRR.=...RRDRR.RDR.#",
	"#...=.....=...=.....=....=..#",
	"#.=========================.#",
	"#.=........=======........=.#",
	"#.=........===B===........=.#",
	"#.=........=======........=.#",
	"#.=........=======........=.#",
	"#.=...........=...........=.#",
	"#.=========================.#",
	"#...=.....=...=...=.....=...#",
	"#.RRDRR.RRDRR.=.RRDRR.RRDRR.#",
	"#.RRRRR.RRRRR.=.RRRRR.RRRRR.#",
	"#.RRRRR.RRRRR.=.RRRRR.RRRRR.#",
	"#.=========================.#",
	"#.RRDRR.......=.......RRDRR.#",
	"#.RRRRR.......G.......RRRRR.#",
	"#############################",
]);

export const TOWN = Object.freeze({
	layoutId: TOWN_LAYOUT_ID,
	level: 0 as const,
	width: 29,
	height: 21,
	terrain,
	buildings,
	arrival: Object.freeze({ row: 17, col: 14 }),
	beacon: Object.freeze({ row: 8, col: 14 }),
	gate: Object.freeze({ row: 19, col: 14 }),
});

export const townTileAt = ({ row, col }: Coordinate): string | undefined =>
	Number.isInteger(row) && Number.isInteger(col) && row >= 0 && col >= 0
		? TOWN.terrain[row]?.[col]
		: undefined;

export const isTownWalkable = (coordinate: Coordinate): boolean => {
	const tile = townTileAt(coordinate);
	return tile !== undefined && [".", "=", "D", "G"].includes(tile);
};
