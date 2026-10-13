import type { SaveDocumentV14 } from "./SaveDocumentV14";
import { isSaveDocumentV13 } from "./SaveShapeV13";
export const isSaveDocumentV14 = (value: unknown): value is SaveDocumentV14 => {
	if (
		typeof value !== "object" ||
		value === null ||
		!("version" in value) ||
		value.version !== 14 ||
		!isSaveDocumentV13({ ...value, version: 13 })
	)
		return false;
	const document = value as SaveDocumentV14;
	const { escape: escapeState, quest, turn } = document.state;
	if (escapeState === null)
		return !quest.cureRecovered || quest.victory !== null;
	return (
		escapeState != null &&
		typeof escapeState === "object" &&
		quest.cureRecovered &&
		Number.isSafeInteger(escapeState.startedTurn) &&
		escapeState.startedTurn >= 0 &&
		escapeState.startedTurn <= turn &&
		Array.isArray(escapeState.activatedFloors) &&
		new Set(escapeState.activatedFloors).size ===
			escapeState.activatedFloors.length &&
		escapeState.activatedFloors.every(
			(floor) =>
				Number.isSafeInteger(floor) && floor >= 1 && floor < quest.goalFloor,
		)
	);
};
