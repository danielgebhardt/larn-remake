import { isDifficulty } from "../game/Difficulty";
import type { SaveDocumentV20 } from "./SaveDocumentV20";
import { isSaveDocumentV19 } from "./SaveShapeV19";

export const isSaveDocumentV20 = (value: unknown): value is SaveDocumentV20 =>
	typeof value === "object" &&
	value !== null &&
	"version" in value &&
	value.version === 20 &&
	"configuration" in value &&
	typeof value.configuration === "object" &&
	value.configuration !== null &&
	"difficulty" in value.configuration &&
	isDifficulty(value.configuration.difficulty) &&
	isSaveDocumentV19({ ...value, version: 19 });
