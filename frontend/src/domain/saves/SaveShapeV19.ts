import { MONSTER_DEFINITIONS } from "../monsters/Monster";
import type { SaveDocumentV19 } from "./SaveDocumentV19";
import { isSaveDocumentV18 } from "./SaveShapeV18";

const record = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown) =>
	typeof value === "string" && value.length > 0 && value.length <= 200;
export const isSaveDocumentV19 = (value: unknown): value is SaveDocumentV19 => {
	if (
		!record(value) ||
		value.version !== 19 ||
		!record(value.state) ||
		!record(value.state.activityHistory) ||
		!Array.isArray(value.state.activityHistory.entries)
	)
		return false;
	const entries = value.state.activityHistory.entries;
	for (const entry of entries) {
		if (!record(entry) || !record(entry.event)) return false;
		const event = entry.event;
		if (
			event.type === "monster-door-opened" &&
			(!text(event.actorId) ||
				!text(event.objectId) ||
				typeof event.monster !== "string" ||
				!Object.hasOwn(MONSTER_DEFINITIONS, event.monster))
		)
			return false;
	}
	// Older schemas remain unchanged; validate shared structure/turn fields with
	// an equivalent older door event, then retain the real event in the snapshot.
	return isSaveDocumentV18({
		...value,
		version: 18,
		state: {
			...value.state,
			activityHistory: {
				...value.state.activityHistory,
				entries: entries.map((entry) => ({
					...entry,
					event:
						entry.event.type === "monster-door-opened"
							? { type: "door-changed", opened: true, turn: entry.event.turn }
							: entry.event,
				})),
			},
		},
	});
};
