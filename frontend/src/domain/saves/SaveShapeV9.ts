import { OBJECT_DEFINITIONS } from "../objects/DungeonObject";
import type { SaveDocumentV9 } from "./SaveDocumentV9";
import { isSavedCoordinate } from "./SaveShapeCommon";
import { isSaveDocumentV8 } from "./SaveShapeV8";
export const isSaveDocumentV9 = (value: unknown): value is SaveDocumentV9 => {
	if (
		typeof value !== "object" ||
		value === null ||
		!("version" in value) ||
		value.version !== 9 ||
		!isSaveDocumentV8({ ...value, version: 8 }) ||
		!("state" in value) ||
		typeof value.state !== "object" ||
		value.state === null ||
		!("objects" in value.state) ||
		!Array.isArray(value.state.objects)
	)
		return false;
	return (
		value.state.objects.length <= 480 &&
		value.state.objects.every(
			(object) =>
				typeof object === "object" &&
				object !== null &&
				typeof object.id === "string" &&
				object.id.length > 0 &&
				object.id.length <= 200 &&
				typeof object.kind === "string" &&
				Object.hasOwn(OBJECT_DEFINITIONS, object.kind) &&
				Number.isInteger(object.floorNumber) &&
				object.floorNumber >= 1 &&
				object.floorNumber <= 20 &&
				isSavedCoordinate(object.coordinate) &&
				typeof object.activated === "boolean",
		)
	);
};
