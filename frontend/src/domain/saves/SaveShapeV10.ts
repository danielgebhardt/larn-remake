import type { SaveDocumentV10 } from "./SaveDocumentV10";
import { isSaveDocumentV9 } from "./SaveShapeV9";
export const isSaveDocumentV10 = (value: unknown): value is SaveDocumentV10 => {
	if (
		typeof value !== "object" ||
		value === null ||
		!("version" in value) ||
		value.version !== 10 ||
		!isSaveDocumentV9({ ...value, version: 9 }) ||
		!("state" in value) ||
		typeof value.state !== "object" ||
		value.state === null ||
		!("gold" in value.state)
	)
		return false;
	return (
		Number.isSafeInteger(value.state.gold) && (value.state.gold as number) >= 0
	);
};
