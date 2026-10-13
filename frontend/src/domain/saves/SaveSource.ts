import { isSaveDocumentV1 } from "./SaveShapeV1";
import { isSaveDocumentV2 } from "./SaveShapeV2";
import { isSaveDocumentV3 } from "./SaveShapeV3";
import { isSaveDocumentV4 } from "./SaveShapeV4";
import { isSaveDocumentV5 } from "./SaveShapeV5";
import { isSaveDocumentV6 } from "./SaveShapeV6";
import { isSaveDocumentV7 } from "./SaveShapeV7";
import { isSaveDocumentV8 } from "./SaveShapeV8";
import { isSaveDocumentV9 } from "./SaveShapeV9";
import { isSaveDocumentV10 } from "./SaveShapeV10";
import { isSaveDocumentV11 } from "./SaveShapeV11";
import { isSaveDocumentV12 } from "./SaveShapeV12";
import { isSaveDocumentV13 } from "./SaveShapeV13";
import { isSaveDocumentV14 } from "./SaveShapeV14";
import { isSaveDocumentV15 } from "./SaveShapeV15";
import { isSaveDocumentV16 } from "./SaveShapeV16";
import { isSaveDocumentV17 } from "./SaveShapeV17";
import { isSaveDocumentV18 } from "./SaveShapeV18";
import { isSaveDocumentV19 } from "./SaveShapeV19";

// Dispatch and the supported source union derive from the same registry.
// Historical guards retain their own contracts and normalization adapters.
const sourceGuards = {
	1: isSaveDocumentV1,
	2: isSaveDocumentV2,
	3: isSaveDocumentV3,
	4: isSaveDocumentV4,
	5: isSaveDocumentV5,
	6: isSaveDocumentV6,
	7: isSaveDocumentV7,
	8: isSaveDocumentV8,
	9: isSaveDocumentV9,
	10: isSaveDocumentV10,
	11: isSaveDocumentV11,
	12: isSaveDocumentV12,
	13: isSaveDocumentV13,
	14: isSaveDocumentV14,
	15: isSaveDocumentV15,
	16: isSaveDocumentV16,
	17: isSaveDocumentV17,
	18: isSaveDocumentV18,
	19: isSaveDocumentV19,
} as const;
type GuardDocument<T> = T extends (value: unknown) => value is infer Document
	? Document
	: never;
export type SaveSourceDocument = GuardDocument<
	(typeof sourceGuards)[keyof typeof sourceGuards]
>;

export const hasSupportedSaveVersion = (
	value: unknown,
): value is { version: keyof typeof sourceGuards } =>
	typeof value === "object" &&
	value !== null &&
	!Array.isArray(value) &&
	"version" in value &&
	typeof value.version === "number" &&
	Object.hasOwn(sourceGuards, value.version);

export const isSaveSourceDocument = (
	value: unknown,
): value is SaveSourceDocument =>
	hasSupportedSaveVersion(value) && sourceGuards[value.version](value);
