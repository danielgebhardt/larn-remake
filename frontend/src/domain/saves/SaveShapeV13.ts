import type { SaveDocumentV13 } from "./SaveDocumentV13";
import { isSaveDocumentV12 } from "./SaveShapeV12";
export const isSaveDocumentV13 = (value: unknown): value is SaveDocumentV13 => {
	if (
		typeof value !== "object" ||
		value === null ||
		!("version" in value) ||
		value.version !== 13 ||
		!isSaveDocumentV12({ ...value, version: 12 })
	)
		return false;
	const document = value as SaveDocumentV13;
	return document.state.monsters.every((monster) => {
		const a = monster.awareness;
		if (a === undefined) return true;
		if (!a || typeof a !== "object") return false;
		if (a.type === "idle") return true;
		if (a.type !== "pursuing" && a.type !== "searching") return false;
		const t = a.target;
		const terrain = document.state.run.floors[monster.floorNumber - 1]?.terrain;
		return (
			t != null &&
			Number.isSafeInteger(t.row) &&
			Number.isSafeInteger(t.col) &&
			terrain?.[t.row]?.[t.col] === "." &&
			Number.isSafeInteger(a.remaining) &&
			a.remaining >= 0 &&
			a.remaining <= 100 &&
			(a.type !== "pursuing" ||
				(Number.isSafeInteger(a.blocked) && a.blocked >= 0 && a.blocked <= 100))
		);
	});
};
