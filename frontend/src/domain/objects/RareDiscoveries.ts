import { hashStringToUint32 } from "../dungeon/DungeonRun";
import { createSeededRandom } from "../dungeon/Seed";
import { appendActivityEvents } from "../game/ActivityHistory";
import type { GameState } from "../game/GameState";
import { ITEM_DEFINITIONS, type ItemKind } from "../items/Item";
import { selectedRunSpellbooks } from "../items/SpellbookPlacement";
import type { DungeonObject } from "./DungeonObject";
import { objectDamage, spendObject } from "./ObjectEffects";
import type { ObjectChoice } from "./ObjectInteraction";
export const openDiscovery = (
	state: GameState,
	object: DungeonObject,
	choice?: ObjectChoice,
): GameState | { error: string } => {
	if (object.activated) return { error: "This discovery is already spent." };
	if (choice !== (object.kind === "reliquary" ? "unseal" : "read"))
		return { error: "Review this discovery's choice first." };
	let kind: ItemKind = "relic-band";
	if (object.kind === "archive") {
		const books = selectedRunSpellbooks(state.run).filter((kind) => {
			const definition = ITEM_DEFINITIONS[kind];
			return (
				definition.type === "spellbook" &&
				definition.minFloor <= object.floorNumber &&
				definition.maxFloor >= object.floorNumber &&
				!state.knownSpells.includes(definition.teaches) &&
				!state.floorItems.some(
					(entry) =>
						entry.item.kind === kind && entry.item.id.endsWith(":reward"),
				) &&
				state.floorItems.some(
					(entry) =>
						entry.item.kind === kind && !entry.item.id.endsWith(":reward"),
				)
			);
		});
		const random = createSeededRandom(
			hashStringToUint32(`${state.run.seed}:${object.id}:reward`),
		);
		kind = books.length
			? books[Math.floor(random() * books.length)]
			: "mana-potion";
	}
	let next = spendObject(state, object);
	const damage = object.kind === "reliquary" ? 3 : 0;
	const event = {
		type: "discovery-opened" as const,
		kind: object.kind,
		item: kind,
		damage,
		turn: state.turn,
	};
	next = damage
		? objectDamage(next, damage, event)
		: {
				...next,
				activityHistory: appendActivityEvents(next.activityHistory, [event]),
			};
	return {
		...next,
		floorItems: [
			// Transfer the existing floor copy into the archive reward.
			...next.floorItems.filter(
				(entry) =>
					entry.item.kind !== kind ||
					ITEM_DEFINITIONS[kind].type !== "spellbook",
			),
			{
				item: { id: `${object.id}:reward`, kind },
				floorNumber: object.floorNumber,
				coordinate: { ...object.coordinate },
			},
		],
	};
};
