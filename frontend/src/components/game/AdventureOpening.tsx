import { Dialog } from "@base-ui/react/dialog";
import { FolderOpen, ScrollText, Shield } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import {
	DEFAULT_RUN_CONFIGURATION,
	type RunConfiguration,
} from "../../domain/dungeon/RunConfiguration";
import { ADVENTURE_STORY } from "../../domain/game/AdventureStory";
import type { SaveDocument } from "../../domain/saves/SaveFormat";
import AdventureSaveSheet from "./AdventureSaveSheet";
import DifficultyChoice from "./DifficultyChoice";
import DungeonSizeChoice from "./DungeonSizeChoice";

const AdventureOpening = ({
	onBegin,
	onRestore,
	startError,
	initialConfiguration = DEFAULT_RUN_CONFIGURATION,
}: {
	onBegin: (configuration: RunConfiguration) => void;
	startError?: string;
	initialConfiguration?: RunConfiguration;
	onRestore: (document: SaveDocument) => void;
}) => {
	const [configuration, setConfiguration] = useState(initialConfiguration);
	const [saveOpen, setSaveOpen] = useState(false);
	const title = useRef<HTMLHeadingElement>(null);
	return (
		<div className="flex min-h-dvh items-center justify-center bg-muted/30 p-6">
			<Dialog.Root open disablePointerDismissal>
				<Dialog.Portal>
					<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs" />
					<Dialog.Popup
						initialFocus={title}
						className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-popover p-5 text-popover-foreground shadow-xl"
					>
						<ScrollText
							aria-hidden="true"
							className="mb-2 size-7 text-primary"
						/>
						<Dialog.Title
							ref={title}
							tabIndex={-1}
							className="text-2xl font-semibold outline-none"
						>
							{ADVENTURE_STORY.title}
						</Dialog.Title>
						<Dialog.Description className="mt-3 text-sm leading-relaxed text-muted-foreground">
							{ADVENTURE_STORY.opening[0]}
						</Dialog.Description>
						{ADVENTURE_STORY.opening.slice(1).map((paragraph) => (
							<p
								key={paragraph}
								className="mt-2 text-sm leading-relaxed text-muted-foreground"
							>
								{paragraph}
							</p>
						))}
						<div className="my-2 flex gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
							<Shield
								aria-hidden="true"
								className="size-5 shrink-0 text-primary"
							/>
							<p>
								Explore carefully. Every action gives your enemies a turn. Your
								spells, supplies, and discoveries may be the difference between
								a safe return and a lost expedition.
							</p>
						</div>
						<p className="mb-3 text-xs text-muted-foreground">
							Inspired by the classic roguelike Larn.
						</p>
						<form
							className="grid gap-3"
							onSubmit={(event) => {
								event.preventDefault();
								onBegin(configuration);
							}}
						>
							<DungeonSizeChoice
								configuration={configuration}
								onChange={(size) =>
									setConfiguration((current) => ({ ...current, ...size }))
								}
							/>
							<DifficultyChoice
								value={configuration.difficulty ?? 1}
								onChange={(difficulty) =>
									setConfiguration((current) => ({ ...current, difficulty }))
								}
							/>
							{startError && (
								<p role="alert" className="text-sm text-destructive">
									{startError}
								</p>
							)}
							<Button type="submit" className="w-full">
								Begin Adventure
							</Button>
						</form>
						<Sheet open={saveOpen} onOpenChange={setSaveOpen}>
							<SheetTrigger
								render={<Button variant="outline" className="mt-2 w-full" />}
							>
								<FolderOpen aria-hidden="true" className="text-primary" />
								Load an existing save
							</SheetTrigger>
							<AdventureSaveSheet onRestore={onRestore} />
						</Sheet>
						<p className="mt-2 text-center text-xs text-muted-foreground">
							<output aria-label="Selected adventure size">
								{configuration.rows} × {configuration.cols} tiles ·{" "}
								{configuration.floorCount} floors
							</output>
						</p>
					</Dialog.Popup>
				</Dialog.Portal>
			</Dialog.Root>
		</div>
	);
};
export default AdventureOpening;
