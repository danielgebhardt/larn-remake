import type { SaveDocumentV3 } from "./SaveDocumentV3";
import { isSaveDocumentV2 } from "./SaveShapeV2";

export const isSaveDocumentV3 = (value: unknown): value is SaveDocumentV3 =>
	typeof value === "object" &&
	value !== null &&
	"version" in value &&
	value.version === 3 &&
	isSaveDocumentV2({ ...value, version: 2 });
