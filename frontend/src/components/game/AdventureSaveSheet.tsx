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
	createSnapshot: () => SaveDocument;
	onRestore: (document: SaveDocument) => void;
	finalFocus?: RefObject<HTMLElement | null>;
}) => {
	const title = useRef<HTMLHeadingElement>(null);
	return (
		<SheetContent
			initialFocus={title}
			finalFocus={finalFocus}
			className="overflow-y-auto data-[side=right]:w-full"
		>
			<SheetHeader>
				<SheetTitle ref={title} tabIndex={-1} className="outline-none">
					Save/Load
				</SheetTitle>
				<SheetDescription>
					Keep an adventure in this browser, or transfer it with a save file.
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
