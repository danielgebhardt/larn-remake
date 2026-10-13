import type { SaveDocumentV15 } from "./SaveDocumentV15";
import { isSavedCoordinate } from "./SaveShapeCommon";
import { isSaveDocumentV14 } from "./SaveShapeV14";

const record = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);
export const isSaveDocumentV15 = (value: unknown): value is SaveDocumentV15 => {
	if (
		!record(value) ||
		value.version !== 15 ||
		!record(value.state) ||
		!Array.isArray(value.state.monsters)
	)
		return false;
	const actors = value.state.monsters;
	const normalized = {
		...value,
		version: 14,
		state: {
			...value.state,
			monsters: actors.map((actor) =>
				record(actor) &&
				record(actor.intent) &&
				["preparing-charge", "recovering-charge"].includes(
					actor.intent.type as string,
				)
					? { ...actor, intent: { type: "idle" } }
					: actor,
			),
		},
	};
	if (!isSaveDocumentV14(normalized)) return false;
	return actors.every((actor) =>
		actor.intent.type === "preparing-charge"
			? Object.keys(actor.intent).length === 2 &&
				isSavedCoordinate(actor.intent.target)
			: actor.intent.type !== "recovering-charge" ||
				Object.keys(actor.intent).length === 1,
	);
};
