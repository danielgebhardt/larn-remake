import { isConsistentSave } from "./SaveConsistency";
import type { SaveDocument, SaveResult } from "./SaveFormat";
import { migrateSaveV1 } from "./SaveMigration";
import { isSaveDocumentV1 } from "./SaveShapeV1";
import { isSaveDocumentV2 } from "./SaveShapeV2";

// Validate the source version before migrating. Callers always receive the
// current document and share one restore boundary for local and file saves.
export const validateSaveDocument = (
	data: unknown,
): SaveResult<SaveDocument> => {
	if (
		typeof data === "object" &&
		data !== null &&
		!Array.isArray(data) &&
		(!("version" in data) || (data.version !== 1 && data.version !== 2))
	)
		return {
			ok: false,
			error: "This save uses an unsupported format version.",
		};
	if (isSaveDocumentV1(data)) {
		return isConsistentSave(data)
			? { ok: true, value: migrateSaveV1(data) }
			: { ok: false, error: "This save contains inconsistent adventure data." };
	}
	if (!isSaveDocumentV2(data))
		return {
			ok: false,
			error: "This save contains invalid or missing adventure data.",
		};
	return isConsistentSave(data)
		? { ok: true, value: data }
		: { ok: false, error: "This save contains inconsistent adventure data." };
};
