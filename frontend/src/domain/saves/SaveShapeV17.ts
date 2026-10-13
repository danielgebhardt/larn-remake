import { isMerchantStock } from "../merchant/MerchantRules";
import type { SaveDocumentV17 } from "./SaveDocumentV17";
import { isSaveDocumentV16 } from "./SaveShapeV16";
export const isSaveDocumentV17 = (value: unknown): value is SaveDocumentV17 =>
	typeof value === "object" &&
	value !== null &&
	"version" in value &&
	value.version === 17 &&
	"state" in value &&
	typeof value.state === "object" &&
	value.state !== null &&
	"merchantStock" in value.state &&
	isMerchantStock(value.state.merchantStock) &&
	isSaveDocumentV16({ ...value, version: 16 });
