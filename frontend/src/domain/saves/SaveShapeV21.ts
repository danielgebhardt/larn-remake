import { MAX_FLOORS } from "../dungeon/RunConfiguration";
import type { SaveDocumentV21 } from "./SaveDocumentV21";
import { isSaveDocumentV20 } from "./SaveShapeV20";

const record = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);
export const isSaveDocumentV21 = (value: unknown): value is SaveDocumentV21 => {
	if (
		!record(value) ||
		value.version !== 21 ||
		!record(value.state) ||
		!record(value.state.activityHistory) ||
		!Array.isArray(value.state.activityHistory.entries)
	)
		return false;
	const entries = value.state.activityHistory.entries;
	for (const entry of entries) {
		if (!record(entry) || !record(entry.event)) return false;
		if (
			entry.event.type === "exit-scroll-used" &&
			(!Number.isSafeInteger(entry.event.fromFloor) ||
				Number(entry.event.fromFloor) < 1 ||
				Number(entry.event.fromFloor) > MAX_FLOORS)
		)
			return false;
	}
	// Reuse validated common turn/ownership/geometry rules without teaching old
	// schemas a new event. Keep the original event in the actual restored data.
	return isSaveDocumentV20({
		...value,
		version: 20,
		state: {
			...value.state,
			activityHistory: {
				...value.state.activityHistory,
				entries: entries.map((entry) => ({
					...entry,
					event:
						entry.event.type === "exit-scroll-used"
							? {
									type: "floor-changed",
									fromFloor: entry.event.fromFloor,
									toFloor: 1,
									turn: entry.event.turn,
								}
							: entry.event,
				})),
			},
		},
	});
};
