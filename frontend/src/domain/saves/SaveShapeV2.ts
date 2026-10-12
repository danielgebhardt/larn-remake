import type { SaveDocumentV2 } from "./SaveDocumentV2";
import { hasSaveAdventureShape, isSavedCoordinate } from "./SaveShapeCommon";

const isIntent = (value: unknown): boolean => {
	if (typeof value !== "object" || value === null || Array.isArray(value))
		return false;
	if (!("type" in value)) return false;
	if (value.type === "idle") return Object.keys(value).length === 1;
	return (
		value.type === "preparing-attack" &&
		Object.keys(value).length === 2 &&
		"target" in value &&
		isSavedCoordinate(value.target)
	);
};
export const isSaveDocumentV2 = (value: unknown): value is SaveDocumentV2 =>
	typeof value === "object" &&
	value !== null &&
	"version" in value &&
	value.version === 2 &&
	hasSaveAdventureShape(value) &&
	value.state.monsters.every(
		(monster) => "intent" in monster && isIntent(monster.intent),
	);
