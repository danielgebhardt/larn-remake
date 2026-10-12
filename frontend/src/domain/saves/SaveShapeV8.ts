import type { SaveDocumentV8 } from "./SaveDocumentV8";
import { isSavedCoordinate } from "./SaveShapeCommon";
import { isSaveDocumentV7 } from "./SaveShapeV7";

const record = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);
export const isSaveDocumentV8 = (value: unknown): value is SaveDocumentV8 => {
	if (
		!record(value) ||
		value.version !== 8 ||
		!record(value.state) ||
		!Array.isArray(value.state.monsters)
	)
		return false;
	const actors = value.state.monsters;
	const normalized = {
		...value,
		version: 7,
		state: {
			...value.state,
			monsters: actors.map((actor) =>
				record(actor) &&
				record(actor.intent) &&
				actor.intent.type === "preparing-area"
					? { ...actor, intent: { type: "idle" } }
					: actor,
			),
		},
	};
	if (!isSaveDocumentV7(normalized)) return false;
	return actors.every((actor) => {
		const intent = actor.intent;
		if (intent.type !== "preparing-area") return true;
		return (
			Object.keys(intent).length === 5 &&
			isSavedCoordinate(intent.target) &&
			[1, 2].includes(intent.radius) &&
			["fire", "cold"].includes(intent.element) &&
			Number.isInteger(intent.remaining) &&
			intent.remaining >= 1 &&
			intent.remaining <= intent.radius + 1
		);
	});
};
