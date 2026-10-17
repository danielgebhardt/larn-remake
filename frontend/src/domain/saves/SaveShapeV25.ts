import { isTownEquipmentStock } from "../town/TownEquipmentStock";
import type { SaveDocumentV25 } from "./SaveDocumentV25";
import { isSaveDocumentV24 } from "./SaveShapeV24";
export const isSaveDocumentV25 = (value: unknown): value is SaveDocumentV25 =>
	typeof value === "object" &&
	value !== null &&
	"version" in value &&
	value.version === 25 &&
	"state" in value &&
	typeof value.state === "object" &&
	value.state !== null &&
	"townEquipmentStock" in value.state &&
	isTownEquipmentStock(value.state.townEquipmentStock) &&
	isSaveDocumentV24({ ...value, version: 24 });
