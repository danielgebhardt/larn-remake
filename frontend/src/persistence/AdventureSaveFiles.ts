import {
	MAX_SAVE_BYTES,
	parseSave,
	type SaveDocument,
	type SaveResult,
	serializeSave,
} from "../domain/saves/SaveFormat";

export const exportAdventureFile = (
	document: SaveDocument,
): SaveResult<null> => {
	try {
		const text = serializeSave(document);
		const checked = parseSave(text);
		if (!checked.ok) return checked;
		const url = URL.createObjectURL(
			new Blob([text], { type: "application/json" }),
		);
		const link = window.document.createElement("a");
		try {
			link.href = url;
			link.download = `larn-seed-${document.state.run.seed}-turn-${document.state.turn}.json`;
			window.document.body.append(link);
			link.click();
		} finally {
			link.remove();
			// Allow the browser to start the download before releasing its URL.
			const release = URL.revokeObjectURL.bind(URL);
			setTimeout(() => release(url), 0);
		}
		return { ok: true, value: null };
	} catch {
		return {
			ok: false,
			error: "Could not download this adventure. Please try again.",
		};
	}
};

export const readAdventureFile = (
	file: File,
	signal?: AbortSignal,
): Promise<SaveResult<SaveDocument>> => {
	if (file.size > MAX_SAVE_BYTES)
		return Promise.resolve({
			ok: false,
			error: "This save file is too large.",
		});
	return new Promise((resolve) => {
		const reader = new FileReader();
		const abort = () => reader.abort();
		const finish = (result: SaveResult<SaveDocument>) => {
			signal?.removeEventListener("abort", abort);
			resolve(result);
		};
		reader.onload = () =>
			finish(
				typeof reader.result === "string"
					? parseSave(reader.result)
					: { ok: false, error: "Could not read this save file." },
			);
		reader.onerror = () =>
			finish({
				ok: false,
				error: "Could not read this save file. Please try another file.",
			});
		reader.onabort = () =>
			finish({ ok: false, error: "Save file reading was canceled." });
		if (signal?.aborted) {
			finish({ ok: false, error: "Save file reading was canceled." });
			return;
		}
		signal?.addEventListener("abort", abort, { once: true });
		try {
			reader.readAsText(file);
		} catch {
			finish({ ok: false, error: "Could not read this save file." });
		}
	});
};
