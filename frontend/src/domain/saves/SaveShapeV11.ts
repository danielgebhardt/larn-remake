import type { SaveDocumentV11 } from "./SaveDocumentV11";
import { hasStackedBagShape } from "./SaveShapeCommon";
import { isSaveDocumentV10 } from "./SaveShapeV10";
export const isSaveDocumentV11 = (value: unknown): value is SaveDocumentV11 => {
	if (
		typeof value !== "object" ||
		value === null ||
		!("version" in value) ||
		value.version !== 11 ||
		!("state" in value) ||
		typeof value.state !== "object" ||
		value.state === null ||
		!("bag" in value.state) ||
		!hasStackedBagShape(value.state.bag)
	)
		return false;
	// Validate unchanged v10 fields independently of its historical 20-copy bag limit.
	return isSaveDocumentV10({
		...value,
		version: 10,
		state: { ...value.state, bag: { items: [] } },
	});
};
