import { isTownPotionStock } from "../town/TownEconomy";
import type { SaveDocumentV24 } from "./SaveDocumentV24";
import { isSaveDocumentV23 } from "./SaveShapeV23";
export const isSaveDocumentV24 = (value: unknown): value is SaveDocumentV24 =>
	typeof value === "object" &&
	value !== null &&
	"version" in value &&
	value.version === 24 &&
	"state" in value &&
	typeof value.state === "object" &&
	value.state !== null &&
	"townPotionStock" in value.state &&
	isTownPotionStock(value.state.townPotionStock) &&
	isSaveDocumentV23({ ...value, version: 23 });
