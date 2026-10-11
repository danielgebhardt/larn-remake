import {
	parseSave,
	type SaveDocument,
	type SaveResult,
	serializeSave,
} from "../domain/saves/SaveFormat";

export const LOCAL_SAVE_KEY = "larn:adventure-save";
type SaveStorage = Pick<Storage, "getItem" | "setItem">;
type StorageProvider = () => SaveStorage;
const browserStorage: StorageProvider = () => window.localStorage;

export const readLocalSave = (
	storage: StorageProvider = browserStorage,
): SaveResult<SaveDocument | null> => {
	try {
		const text = storage().getItem(LOCAL_SAVE_KEY);
		return text === null ? { ok: true, value: null } : parseSave(text);
	} catch {
		return {
			ok: false,
			error:
				"Browser storage is unavailable. You can still export or import a save file.",
		};
	}
};

export const writeLocalSave = (
	document: SaveDocument,
	storage: StorageProvider = browserStorage,
): SaveResult<SaveDocument> => {
	try {
		const text = serializeSave(document);
		const checked = parseSave(text);
		if (!checked.ok) return checked;
		// One atomic setItem: never remove the previous slot before writing its replacement.
		storage().setItem(LOCAL_SAVE_KEY, text);
		return checked;
	} catch {
		return {
			ok: false,
			error:
				"Could not save in this browser. Storage may be full or unavailable. Your previous save was not replaced.",
		};
	}
};
