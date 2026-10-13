import {
	type ExplorationState,
	updateExploration,
} from "../dungeon/Exploration";
import type {
	FogConfiguration,
	RunConfiguration,
} from "../dungeon/RunConfiguration";
import type { GameState } from "../game/GameState";
import { levelForExperience } from "../game/Progression";
import { navigationRun } from "../objects/NavigationTerrain";
import type { SaveDocumentV12 } from "./SaveDocumentV12";
import { validateSaveDocument } from "./SaveValidation";

export const SAVE_FORMAT_VERSION = 12;
// Bound imported input before parsing. A maximum-size snapshot is measured in the review.
export const MAX_SAVE_BYTES = 4 * 1024 * 1024;

export type SaveDocument = SaveDocumentV12;
export type RestoredAdventure = {
	state: GameState;
	exploration: ExplorationState;
	configuration: RunConfiguration;
	fog: FogConfiguration;
};
export type SaveResult<T> =
	| { ok: true; value: T }
	| { ok: false; error: string };

export const createSaveDocument = (
	state: GameState,
	exploration: ExplorationState,
	configuration: RunConfiguration,
	fog: FogConfiguration,
	now = new Date(),
): SaveDocument => ({
	version: SAVE_FORMAT_VERSION,
	savedAt: now.toISOString(),
	configuration: { ...configuration },
	fog: { ...fog },
	state: {
		gold: state.gold,
		turn: state.turn,
		objects: state.objects.map(
			({ id, kind, floorNumber, coordinate, activated }) => ({
				id,
				kind,
				floorNumber,
				coordinate: { ...coordinate },
				activated,
			}),
		),
		mana: state.mana,
		knownSpells: state.knownSpells,
		spellHotbar: state.spellHotbar,
		effects: state.effects,
		quest: state.quest,
		monstersDefeated: state.monstersDefeated,
		player: state.player,
		progression: state.progression,
		equipment: state.equipment,
		bag: state.bag,
		potionHotbar: state.potionHotbar,
		floorItems: state.floorItems,
		monsters: state.monsters.map(
			({
				id,
				kind,
				floorNumber,
				coordinate,
				health,
				intent,
				lastDamagedTurn,
			}) => ({
				id,
				kind,
				floorNumber,
				coordinate,
				health,
				lastDamagedTurn: lastDamagedTurn ?? null,
				intent:
					intent.type === "idle"
						? { type: "idle" }
						: intent.type === "preparing-area"
							? {
									type: "preparing-area",
									target: { ...intent.target },
									radius: intent.radius,
									element: intent.element,
									remaining: intent.remaining,
								}
							: { type: "preparing-attack", target: { ...intent.target } },
			}),
		),
		activityHistory: state.activityHistory,
		run: {
			seed: state.run.seed,
			activeFloor: state.run.activeFloor,
			playerCoordinate: state.run.playerCoordinate,
			floors: state.run.floors.map((floor) => ({
				floorNumber: floor.floorNumber,
				partitions: floor.partitions,
				rooms: floor.rooms,
				corridors: floor.corridors,
				upStair: floor.upStair,
				downStair: floor.downStair,
				terrain: floor.terrain.map((row) => row.join("")),
			})),
		},
	},
	explored: [...exploration.explored].map(([floorNumber, grid]) => ({
		floorNumber,
		rows: grid.map((row) => row.map((seen) => (seen ? "1" : "0")).join("")),
	})),
});

export const serializeSave = (document: SaveDocument): string =>
	JSON.stringify(document);

export const parseSave = (text: string): SaveResult<SaveDocument> => {
	if (new TextEncoder().encode(text).length > MAX_SAVE_BYTES)
		return { ok: false, error: "This save file is too large." };
	let data: unknown;
	try {
		data = JSON.parse(text);
	} catch {
		return { ok: false, error: "This is not a valid adventure save file." };
	}
	return validateSaveDocument(data);
};

// Call only with a document accepted by parseSave; storage and import share that boundary.
export const restoreSave = (document: SaveDocument): RestoredAdventure => {
	const state: GameState = {
		...document.state,
		run: {
			...document.state.run,
			floors: document.state.run.floors.map((floor) => ({
				floorNumber: floor.floorNumber,
				partitions: floor.partitions,
				rooms: floor.rooms,
				corridors: floor.corridors,
				upStair: floor.upStair,
				downStair: floor.downStair,
				terrain: floor.terrain.map((row) => [...row]),
			})),
		},
	};
	const explored = new Map(
		document.explored.map(({ floorNumber, rows }) => [
			floorNumber,
			rows.map((row) => [...row].map((cell) => cell === "1")),
		]),
	);
	const initial = updateExploration(navigationRun(state), document.fog.radius);
	return {
		state,
		configuration: document.configuration,
		fog: document.fog,
		exploration: updateExploration(navigationRun(state), document.fog.radius, {
			...initial,
			// Force current sight to be recomputed while retaining every floor's memory.
			origin: { row: -1, col: -1 },
			explored,
		}),
	};
};

export const saveSummary = (document: SaveDocument): string =>
	`Seed ${document.state.run.seed} · Floor ${document.state.run.activeFloor} of ${document.state.run.floors.length} · Level ${levelForExperience(document.state.progression.experience)} · Turn ${document.state.turn}`;
