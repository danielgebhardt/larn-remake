import type { SaveDocumentV16 } from "./SaveDocumentV16";
import { isSavedCoordinate } from "./SaveShapeCommon";
import { isSaveDocumentV15 } from "./SaveShapeV15";

const record = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);
export const isSaveDocumentV16 = (value: unknown): value is SaveDocumentV16 => {
	if (
		!record(value) ||
		value.version !== 16 ||
		!record(value.state) ||
		!Array.isArray(value.state.monsters)
	)
		return false;
	const actors = value.state.monsters;
	const normalized = {
		...value,
		version: 15,
		state: {
			...value.state,
			monsters: actors.map((actor) =>
				record(actor) &&
				record(actor.intent) &&
				actor.intent.type === "preparing-alarm"
					? { ...actor, intent: { type: "idle" } }
					: actor,
			),
		},
	};
	if (!isSaveDocumentV15(normalized)) return false;
	return actors.every(
		(actor) =>
			(actor.alarmUsed === undefined || typeof actor.alarmUsed === "boolean") &&
			(actor.intent.type !== "preparing-alarm" ||
				(Object.keys(actor.intent).length === 2 &&
					isSavedCoordinate(actor.intent.target))),
	);
};
