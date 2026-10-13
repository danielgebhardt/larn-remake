import { isConsistentSave } from "./SaveConsistency";
import type { SaveDocument, SaveResult } from "./SaveFormat";
import {
	migratePlayedSave,
	migrateSaveV1,
	migrateSaveV2,
} from "./SaveMigration";
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

const inconsistent = {
	ok: false,
	error: "This save contains inconsistent adventure data.",
} as const;
export const validateSaveDocument = (
	data: unknown,
): SaveResult<SaveDocument> => {
	if (
		typeof data === "object" &&
		data !== null &&
		!Array.isArray(data) &&
		(!("version" in data) ||
			![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(data.version as number))
	)
		return {
			ok: false,
			error: "This save uses an unsupported format version.",
		};
	if (isSaveDocumentV1(data) || isSaveDocumentV2(data)) {
		if (!isConsistentSave(data)) return inconsistent;
		const grown = migrateSaveV2(
			data.version === 1 ? migrateSaveV1(data) : data,
		);
		const current = migratePlayedSave(grown);
		return isConsistentSave(current)
			? { ok: true, value: current }
			: inconsistent;
	}
	if (
		!(
			isSaveDocumentV3(data) ||
			isSaveDocumentV4(data) ||
			isSaveDocumentV5(data) ||
			isSaveDocumentV6(data) ||
			isSaveDocumentV7(data) ||
			isSaveDocumentV8(data) ||
			isSaveDocumentV9(data) ||
			isSaveDocumentV10(data) ||
			isSaveDocumentV11(data) ||
			isSaveDocumentV12(data)
		)
	)
		return {
			ok: false,
			error: "This save contains invalid or missing adventure data.",
		};
	if (!isConsistentSave(data)) return inconsistent;
	const current = migratePlayedSave(data);
	return isConsistentSave(current)
		? { ok: true, value: current }
		: inconsistent;
};
