import { isPermanentAttributes } from "../game/PermanentAttributes";
import type { SaveDocumentV26 } from "./SaveDocumentV26";
import { isSaveDocumentV25 } from "./SaveShapeV25";
export const isSaveDocumentV26 = (value: unknown): value is SaveDocumentV26 =>
	typeof value === "object" &&
	value !== null &&
	"version" in value &&
	value.version === 26 &&
	"state" in value &&
	typeof value.state === "object" &&
	value.state !== null &&
	"progression" in value.state &&
	typeof value.state.progression === "object" &&
	value.state.progression !== null &&
	"permanentAttributes" in value.state.progression &&
	isPermanentAttributes(value.state.progression.permanentAttributes) &&
	isSaveDocumentV25({ ...value, version: 25 });
