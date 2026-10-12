import { isConsistentSave } from "./SaveConsistency";
import type { SaveDocument, SaveResult } from "./SaveFormat";
import { migrateSaveV1, migrateSaveV2 } from "./SaveMigration";
import { isSaveDocumentV1 } from "./SaveShapeV1";
import { isSaveDocumentV2 } from "./SaveShapeV2";
import { isSaveDocumentV3 } from "./SaveShapeV3";

export const validateSaveDocument = (
	data: unknown,
): SaveResult<SaveDocument> => {
	if (
		typeof data === "object" &&
		data !== null &&
		!Array.isArray(data) &&
		(!("version" in data) || ![1, 2, 3].includes(data.version as number))
	)
		return {
			ok: false,
			error: "This save uses an unsupported format version.",
		};
	if (isSaveDocumentV1(data) || isSaveDocumentV2(data)) {
		if (!isConsistentSave(data))
			return {
				ok: false,
				error: "This save contains inconsistent adventure data.",
			};
		const current = migrateSaveV2(
			data.version === 1 ? migrateSaveV1(data) : data,
		);
		return isConsistentSave(current)
			? { ok: true, value: current }
			: { ok: false, error: "This save contains inconsistent adventure data." };
	}
	if (!isSaveDocumentV3(data))
		return {
			ok: false,
			error: "This save contains invalid or missing adventure data.",
		};
	return isConsistentSave(data)
		? { ok: true, value: data }
		: { ok: false, error: "This save contains inconsistent adventure data." };
};
