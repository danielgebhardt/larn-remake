import { Dialog } from "@base-ui/react/dialog";
import { ScrollText, Shield } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

const AdventureOpening = ({ onBegin }: { onBegin: () => void }) => {
	const title = useRef<HTMLHeadingElement>(null);
	return (
		<div className="flex min-h-dvh items-center justify-center bg-muted/30 p-6">
			<Dialog.Root open disablePointerDismissal>
				<Dialog.Portal>
					<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs" />
					<Dialog.Popup
						initialFocus={title}
						className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-popover p-6 text-popover-foreground shadow-xl sm:p-8"
					>
						<ScrollText
							aria-hidden="true"
							className="mb-4 size-9 text-primary"
						/>
						<p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
							Larn Remake
						</p>
						<Dialog.Title
							ref={title}
							tabIndex={-1}
							className="text-2xl font-semibold"
						>
							A journey for the cure
						</Dialog.Title>
						<Dialog.Description className="mt-4 leading-relaxed text-muted-foreground">
							A mysterious illness has reached your home. Far below, in the
							forgotten halls of Larn, lies the cure. Descend into the dungeon,
							recover it from the deepest floor, and return safely with the
							cure.
						</Dialog.Description>
						<div className="my-6 flex gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
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
						<Button className="w-full" onClick={onBegin}>
							Begin Adventure
						</Button>
						<p className="mt-3 text-center text-xs text-muted-foreground">
							A new seed. A new journey.
						</p>
					</Dialog.Popup>
				</Dialog.Portal>
			</Dialog.Root>
		</div>
	);
};
export default AdventureOpening;
