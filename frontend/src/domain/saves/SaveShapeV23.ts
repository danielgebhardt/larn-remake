import { isTownLocation } from "../town/TownLocation";
import type { SaveDocumentV23 } from "./SaveDocumentV23";
import { isSaveDocumentV22 } from "./SaveShapeV22";
export const isSaveDocumentV23 = (value: unknown): value is SaveDocumentV23 => {
	if (
		typeof value !== "object" ||
		value === null ||
		!("version" in value) ||
		value.version !== 23 ||
		!("state" in value) ||
		typeof value.state !== "object" ||
		value.state === null ||
		!("town" in value.state) ||
		(value.state.town !== null && !isTownLocation(value.state.town))
	)
		return false;
	return isSaveDocumentV22({ ...value, version: 22 });
};
