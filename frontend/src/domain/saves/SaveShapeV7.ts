import type { SaveDocumentV7 } from "./SaveDocumentV7";
import { isSaveDocumentV6 } from "./SaveShapeV6";
export const isSaveDocumentV7 = (value: unknown): value is SaveDocumentV7 => {
	if (
		typeof value !== "object" ||
		value === null ||
		!("version" in value) ||
		value.version !== 7 ||
		!isSaveDocumentV6({ ...value, version: 6 })
	)
		return false;
	const document = value as SaveDocumentV7;
	return document.state.monsters.every(
		(monster) =>
			monster.lastDamagedTurn === null ||
			(Number.isSafeInteger(monster.lastDamagedTurn) &&
				monster.lastDamagedTurn >= 0 &&
				monster.lastDamagedTurn <= document.state.turn),
	);
};
