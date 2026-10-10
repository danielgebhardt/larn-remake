import {
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	Footprints,
	Keyboard,
	Shield,
} from "lucide-react";
import type { ReactNode } from "react";
import {
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";

const Keycap = ({
	children,
	label,
}: {
	children: ReactNode;
	label?: string;
}) => (
	<kbd
		aria-label={label}
		className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-border bg-background px-2 font-mono text-xs font-semibold text-foreground shadow-sm"
	>
		{children}
	</kbd>
);
const movementControls = [
	{ direction: "up", key: "W", Icon: ArrowUp },
	{ direction: "left", key: "A", Icon: ArrowLeft },
	{ direction: "down", key: "S", Icon: ArrowDown },
	{ direction: "right", key: "D", Icon: ArrowRight },
];
const DungeonHelp = () => (
	<SheetContent className="overflow-y-auto data-[side=right]:w-full">
		<SheetHeader>
			<SheetTitle>Help / Controls</SheetTitle>
			<SheetDescription>
				A quick guide to exploring the dungeon.
			</SheetDescription>
		</SheetHeader>
		<div className="grid gap-6 px-4 pb-6">
			<section aria-labelledby="keyboard-controls-title" className="grid gap-3">
				<h3
					id="keyboard-controls-title"
					className="flex items-center gap-2 font-medium"
				>
					<Keyboard
						aria-hidden="true"
						className="size-4 text-muted-foreground"
					/>{" "}
					Keyboard controls
				</h3>
				<ul className="divide-y divide-border rounded-lg border bg-muted/30 px-3">
					{movementControls.map(({ direction, key, Icon }) => (
						<li
							key={direction}
							className="flex items-center justify-between gap-3 py-3"
						>
							<span>Move {direction}</span>
							<span className="flex items-center gap-2">
								<Keycap>{key}</Keycap>
								<span className="text-xs text-muted-foreground">or</span>
								<Keycap label={`Arrow ${direction}`}>
									<Icon aria-hidden="true" className="size-4" />
								</Keycap>
							</span>
						</li>
					))}
					<li className="flex items-center justify-between gap-3 py-3">
						<span>Wait one turn</span>
						<Keycap>Space</Keycap>
					</li>
					<li className="flex items-center justify-between gap-3 py-3">
						<span>Pick up an item</span>
						<Keycap>G</Keycap>
					</li>
					<li className="flex items-center justify-between gap-3 py-3">
						<span>Close this sheet</span>
						<Keycap>Esc</Keycap>
					</li>
				</ul>
				<p className="text-xs leading-relaxed text-muted-foreground">
					Click the dungeon map to focus gameplay. While a menu is open,
					gameplay keys are paused.
				</p>
			</section>
			<section aria-labelledby="gameplay-notes-title" className="grid gap-3">
				<h3
					id="gameplay-notes-title"
					className="flex items-center gap-2 font-medium"
				>
					<Footprints
						aria-hidden="true"
						className="size-4 text-muted-foreground"
					/>{" "}
					Exploring and combat
				</h3>
				<ul className="grid gap-3 text-sm leading-relaxed text-muted-foreground">
					<li>
						<span className="font-medium text-foreground">Attack.</span> Move
						into a monster to attack. You stay on your current tile.
					</li>
					<li>
						<span className="font-medium text-foreground">Wait.</span> Stay in
						place while monsters take their turn. Press Space once for each
						turn; holding it does not repeat.
					</li>
					<li>
						<span className="font-medium text-foreground">Stairs.</span> Enter a
						stair tile to change floors automatically.
					</li>
					<li>
						<span className="font-medium text-foreground">Equipment.</span> Open
						Character to inspect items, equip carried gear, or unequip an
						occupied slot. Successful gear changes use a turn; inspecting items
						is free.
					</li>
					<li>
						<span className="font-medium text-foreground">Items.</span> Use G to
						pick up an item on your current tile; multiple items open a chooser.
						You can also use Character to pick up or drop items. Successful
						transfers use a turn; opening or dismissing the chooser is free.
						Unequip worn gear before dropping it.
					</li>
					<li>
						<span className="font-medium text-foreground">Potions.</span> Select
						a healing potion in Character and choose Drink potion. It restores
						up to 5 health before monsters act, using one turn. At full health,
						it costs nothing and stays in your bag. Potions cannot be used after
						death.
					</li>
					<li>
						<span className="font-medium text-foreground">Turns.</span>{" "}
						Successful movement, attacks, and waiting use a turn. Blocked
						movement does not use a turn.
					</li>
				</ul>
			</section>
			<p className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
				<Shield aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
				Opening Help, Settings, or Character does not use a turn.
			</p>
		</div>
	</SheetContent>
);
export default DungeonHelp;
