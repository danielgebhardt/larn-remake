import { isConsistentSave } from "./SaveConsistency";
import type { SaveDocument, SaveResult } from "./SaveFormat";
import { isSaveDocumentV1 } from "./SaveShapeV1";

// Dispatch by version before interpreting fields. Future migrations belong at
// this boundary, after validating the source version and before restoring state.
export const validateSaveDocument = (
	data: unknown,
): SaveResult<SaveDocument> => {
	if (
		typeof data === "object" &&
		data !== null &&
		!Array.isArray(data) &&
		(!("version" in data) || data.version !== 1)
	)
		return {
			ok: false,
			error: "This save uses an unsupported format version.",
		};
	if (!isSaveDocumentV1(data))
		return {
			ok: false,
			error: "This save contains invalid or missing adventure data.",
		};
	return isConsistentSave(data)
		? { ok: true, value: data }
		: { ok: false, error: "This save contains inconsistent adventure data." };
};
