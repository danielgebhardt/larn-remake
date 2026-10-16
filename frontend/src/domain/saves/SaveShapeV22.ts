import type { SaveDocumentV22 } from "./SaveDocumentV22";
import { isSaveDocumentV21 } from "./SaveShapeV21";

const record = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);
export const isSaveDocumentV22 = (value: unknown): value is SaveDocumentV22 => {
	if (
		!record(value) ||
		value.version !== 22 ||
		!record(value.state) ||
		!record(value.state.activityHistory) ||
		!Array.isArray(value.state.activityHistory.entries)
	)
		return false;
	const entries = value.state.activityHistory.entries;
	for (const entry of entries) {
		if (!record(entry) || !record(entry.event)) return false;
		if (
			entry.event.type === "player-spell-hit" &&
			(entry.event.spell !== "fireball" ||
				!Number.isSafeInteger(entry.event.damage) ||
				Number(entry.event.damage) < 1)
		)
			return false;
	}
	// Adapt only the validation view; retain the actual friendly-fire history.
	return isSaveDocumentV21({
		...value,
		version: 21,
		state: {
			...value.state,
			activityHistory: {
				...value.state.activityHistory,
				entries: entries.map((entry) => ({
					...entry,
					event:
						entry.event.type === "player-spell-hit"
							? {
									type: "spell-healed",
									spell: entry.event.spell,
									recovered: entry.event.damage,
									turn: entry.event.turn,
								}
							: entry.event,
				})),
			},
		},
	});
};
