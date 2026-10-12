import type { SaveDocumentV1 } from "./SaveDocumentV1";
import { hasSaveAdventureShape } from "./SaveShapeCommon";

export const isSaveDocumentV1 = (value: unknown): value is SaveDocumentV1 =>
	typeof value === "object" &&
	value !== null &&
	"version" in value &&
	value.version === 1 &&
	hasSaveAdventureShape(value);
