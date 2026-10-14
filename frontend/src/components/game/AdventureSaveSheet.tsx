import { FolderOpen, Save } from "lucide-react";
import { type RefObject, useRef } from "react";
import {
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import type { SaveDocument } from "../../domain/saves/SaveFormat";
import AdventureSaveControls from "../../settings/AdventureSaveControls";

const AdventureSaveSheet = ({
	createSnapshot,
	onRestore,
	finalFocus,
}: {
	createSnapshot?: () => SaveDocument;
	onRestore: (document: SaveDocument) => void;
	finalFocus?: RefObject<HTMLElement | null> | false;
}) => {
	const title = useRef<HTMLHeadingElement>(null);
	return (
		<SheetContent
			initialFocus={title}
			finalFocus={finalFocus}
			className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md"
		>
			<SheetHeader className="gap-3 border-b border-primary/20 bg-primary/5 pr-12">
				<div className="flex items-center gap-3">
					<span className="rounded-lg bg-primary/10 p-2 text-primary">
						{createSnapshot ? (
							<Save aria-hidden="true" className="size-5" />
						) : (
							<FolderOpen aria-hidden="true" className="size-5" />
						)}
					</span>
					<SheetTitle ref={title} tabIndex={-1} className="outline-none">
						{createSnapshot ? "Save/Load" : "Load adventure"}
					</SheetTitle>
				</div>
				<SheetDescription>
					{createSnapshot
						? "Keep your adventure here, or take a save file with you."
						: "Continue a saved adventure from this browser or a file."}
				</SheetDescription>
			</SheetHeader>
			<div className="px-4 pb-4">
				<AdventureSaveControls
					createSnapshot={createSnapshot}
					onRestore={onRestore}
				/>
			</div>
		</SheetContent>
	);
};

export default AdventureSaveSheet;
