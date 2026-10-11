import { Dialog } from "@base-ui/react/dialog";
import { Download, FolderOpen, Save, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { type SaveDocument, saveSummary } from "../domain/saves/SaveFormat";
import {
	exportAdventureFile,
	readAdventureFile,
} from "../persistence/AdventureSaveFiles";
import {
	readLocalSave,
	writeLocalSave,
} from "../persistence/LocalAdventureSave";

const AdventureSaveControls = ({
	createSnapshot,
	onRestore,
}: {
	createSnapshot: () => SaveDocument;
	onRestore: (document: SaveDocument) => void;
}) => {
	const [slot, setSlot] = useState(readLocalSave);
	const [feedback, setFeedback] = useState("");
	const [pending, setPending] = useState<{
		kind: "save" | "load";
		document: SaveDocument;
	} | null>(null);
	const cancelRef = useRef<HTMLButtonElement>(null);
	const initiatorRef = useRef<HTMLButtonElement | null>(null);
	const fileInput = useRef<HTMLInputElement>(null);
	const fileRead = useRef<AbortController | null>(null);
	const [importing, setImporting] = useState(false);
	useEffect(() => () => fileRead.current?.abort(), []);
	const exportFile = () => {
		try {
			const result = exportAdventureFile(createSnapshot());
			setFeedback(result.ok ? "Save file download started." : result.error);
		} catch {
			setFeedback("Could not prepare this adventure for export.");
		}
	};
	const importFile = async (file: File) => {
		fileRead.current?.abort();
		const controller = new AbortController();
		fileRead.current = controller;
		setImporting(true);
		setFeedback("");
		const result = await readAdventureFile(file, controller.signal);
		if (controller.signal.aborted) return;
		setImporting(false);
		if (result.ok) onRestore(result.value);
		else setFeedback(result.error);
	};

	const saved = slot.ok ? slot.value : null;
	const requestSave = (button: HTMLButtonElement) => {
		initiatorRef.current = button;
		setSlot(readLocalSave());
		try {
			setPending({ kind: "save", document: createSnapshot() });
			setFeedback("");
		} catch {
			setFeedback("Could not prepare this adventure for saving.");
		}
	};
	const requestLoad = (button: HTMLButtonElement) => {
		initiatorRef.current = button;
		const latest = readLocalSave();
		setSlot(latest);
		if (!latest.ok) {
			setFeedback(latest.error);
			return;
		}
		if (!latest.value) {
			setFeedback("No local adventure has been saved yet.");
			return;
		}
		setPending({ kind: "load", document: latest.value });
		setFeedback("");
	};
	const confirm = () => {
		if (!pending) return;
		if (pending.kind === "load") {
			onRestore(pending.document);
		} else {
			const result = writeLocalSave(pending.document);
			if (result.ok) {
				setSlot(result);
				setFeedback("Adventure saved in this browser.");
			} else setFeedback(result.error);
		}
		setPending(null);
	};
	return (
		<section aria-label="Adventure saves" className="grid gap-3 border-t pt-4">
			<h3 className="font-medium">Save and load</h3>
			<p className="text-xs text-muted-foreground">
				One manual save in this browser. Saving replaces this slot; loading
				replaces your current adventure.
			</p>
			<div className="rounded-lg border bg-muted/20 p-3 text-xs">
				{saved ? (
					<>
						<p>{saveSummary(saved)}</p>
						<time
							dateTime={saved.savedAt}
							className="mt-1 block text-muted-foreground"
						>
							{new Date(saved.savedAt).toLocaleString()}
						</time>
					</>
				) : (
					<p>{slot.ok ? "No saved adventure yet." : slot.error}</p>
				)}
			</div>
			<div className="grid grid-cols-2 gap-2">
				<Button
					variant="outline"
					disabled={importing}
					onClick={(event) => requestSave(event.currentTarget)}
				>
					<Save aria-hidden="true" />
					Save adventure
				</Button>
				<Button
					variant="outline"
					disabled={!saved || importing}
					onClick={(event) => requestLoad(event.currentTarget)}
				>
					<FolderOpen aria-hidden="true" />
					Load adventure
				</Button>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<Button variant="outline" disabled={importing} onClick={exportFile}>
					<Download aria-hidden="true" />
					Export file
				</Button>
				<Button
					variant="outline"
					disabled={importing}
					onClick={() => fileInput.current?.click()}
				>
					<Upload aria-hidden="true" />
					{importing ? "Reading file…" : "Import file"}
				</Button>
			</div>
			<input
				ref={fileInput}
				type="file"
				accept=".json,application/json"
				aria-label="Import adventure file"
				className="sr-only"
				tabIndex={-1}
				disabled={importing}
				onChange={(event) => {
					const file = event.currentTarget.files?.[0];
					event.currentTarget.value = "";
					if (file) void importFile(file);
				}}
			/>
			<p className="text-xs text-muted-foreground">
				Export a backup or import one to resume here. Import replaces the
				current adventure immediately after validation; it does not change the
				browser save slot.
			</p>

			{feedback && (
				<p
					role="status"
					aria-label="Save feedback"
					className="text-xs text-muted-foreground"
				>
					{feedback}
				</p>
			)}
			<Dialog.Root
				open={pending !== null}
				onOpenChange={(open) => {
					if (!open) setPending(null);
				}}
			>
				<Dialog.Portal>
					<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs" />
					<Dialog.Popup
						initialFocus={cancelRef}
						finalFocus={initiatorRef}
						className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-popover p-5 text-popover-foreground shadow-xl"
					>
						<Dialog.Title className="text-lg font-semibold">
							{pending?.kind === "load"
								? "Load saved adventure?"
								: "Save this adventure?"}
						</Dialog.Title>
						<Dialog.Description className="mt-2 text-sm text-muted-foreground">
							{pending?.kind === "load"
								? "Your current progress will be replaced by this saved adventure."
								: saved
									? "Your previous saved adventure will be replaced."
									: slot.ok
										? "Store this adventure in your browser's single save slot."
										: "The existing slot cannot be read. Saving will replace it."}
						</Dialog.Description>
						{pending && (
							<p className="mt-3 rounded-md border bg-muted/20 p-3 text-sm">
								{saveSummary(pending.document)}
							</p>
						)}
						{pending?.kind === "save" && saved && (
							<p className="mt-2 text-xs text-muted-foreground">
								Replacing: {saveSummary(saved)}
							</p>
						)}
						<div className="mt-5 flex justify-end gap-2">
							<Button
								ref={cancelRef}
								variant="outline"
								onClick={() => setPending(null)}
							>
								Cancel
							</Button>
							<Button onClick={confirm}>
								{pending?.kind === "load" ? "Confirm load" : "Confirm save"}
							</Button>
						</div>
					</Dialog.Popup>
				</Dialog.Portal>
			</Dialog.Root>
		</section>
	);
};

export default AdventureSaveControls;
