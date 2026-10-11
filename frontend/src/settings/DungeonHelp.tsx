import {
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	Footprints,
	Keyboard,
	Map as MapIcon,
	Shield,
} from "lucide-react";
import type { ReactNode } from "react";
import {
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import DungeonLegend from "../components/dungeon/DungeonLegend.tsx";
import { MANA_RECOVERY_INTERVAL } from "../domain/game/Mana";
import {
	MONSTER_HIT_CHANCE,
	PLAYER_HIT_CHANCE,
} from "../domain/game/MeleeRules";
import { HEALTH_PER_LEVEL, MAX_PLAYER_LEVEL } from "../domain/game/Progression";
import { SPELL_DEFINITIONS } from "../domain/game/Spells";

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
						<span>Open / close Character</span>
						<span className="flex gap-1">
							<Keycap>I</Keycap>
							<Keycap>C</Keycap>
						</span>
					</li>
					<li className="flex items-center justify-between gap-3 py-3">
						<span>Use potion shortcut</span>
						<span className="flex gap-1">
							<Keycap>1</Keycap>
							<Keycap>2</Keycap>
							<Keycap>3</Keycap>
							<Keycap>4</Keycap>
						</span>
					</li>
					<li className="flex items-center justify-between gap-3 py-3">
						<span>Target a ranged spell</span>
						<Keycap>Z</Keycap>
					</li>
					<li className="flex items-center justify-between gap-3 py-3">
						<span>Cast Heal on self</span>
						<Keycap>H</Keycap>
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
			<section aria-labelledby="map-symbols-title" className="grid gap-3">
				<h3
					id="map-symbols-title"
					className="flex items-center gap-2 font-medium"
				>
					<MapIcon
						aria-hidden="true"
						className="size-4 text-muted-foreground"
					/>
					Map symbols
				</h3>
				<DungeonLegend />
				<p className="text-xs leading-relaxed text-muted-foreground">
					Visibility shading applies when fog of war is enabled.
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
						into a monster to attack. You stay on your current tile, and a miss
						still uses a turn. Starting player hit chance is {PLAYER_HIT_CHANCE}
						%; starting monster hit chance is {MONSTER_HIT_CHANCE}%. Dexterity
						changes these chances. Landed damage varies within the range shown
						in Character. Armor reduces landed damage to a minimum of 1; misses
						deal no damage. The same seed and actions reproduce outcomes.
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
						<span className="font-medium text-foreground">Quest.</span> Recover
						the cure on the final floor with G, then return to the entrance on
						floor 1. The protected quest pouch uses no bag slot; the cure cannot
						be drunk or dropped. Step onto the entrance tile with the cure to
						win. There is no time limit.
					</li>
					<li>
						<span className="font-medium text-foreground">Equipment.</span> Open
						Character to inspect items, equip carried gear, or unequip an
						occupied slot. Main/off hand, chest, and head are available; armor
						from shield, chest, and head adds together. Successful gear changes
						use a turn; inspecting items is free.
					</li>
					<li>
						<span className="font-medium text-foreground">Items.</span> Use G to
						pick up an item on your current tile; multiple items open a chooser.
						In the chooser, press 1–9 to pick an item instead of using a potion.
						Use Page Up / Page Down for larger piles. You can also use Character
						to pick up or drop items. Successful transfers use a turn; opening
						or dismissing the chooser is free. Unequip worn gear before dropping
						it.
					</li>
					<li>
						<span className="font-medium text-foreground">Potions.</span> Select
						a healing or mana potion in Character and choose Drink potion.
						Picking up a new potion kind assigns it to the first empty shortcut.
						You can also assign it to a shortcut and use keys 1–4 (or click its
						slot above the map). It restores up to 5 health or mana before
						monsters act, using one turn. At full health or mana respectively,
						it costs nothing and stays in your bag. Empty or unavailable
						shortcuts also cost nothing. Potions cannot be used after death.
					</li>
					<li>
						<span className="font-medium text-foreground">Mana.</span> Recover 1
						mana after every {MANA_RECOVERY_INTERVAL} successful turns,
						including waiting, after monsters act. Safe rooms allow unlimited
						waiting and recovery. Opening menus or canceling targeting does not
						recover mana.
					</li>
					<li>
						<span className="font-medium text-foreground">Turns.</span>{" "}
						Successful movement, attacks, and waiting use a turn. Blocked
						movement does not use a turn.
					</li>
				</ul>
			</section>
			<section
				aria-label="Spellcasting"
				className="grid gap-3 rounded-lg border p-4 text-sm"
			>
				<h3 className="font-medium">Spells and mana</h3>
				<p>
					Both starting spells are known. Click a spell above the map, or use
					its shortcut after closing menus.
				</p>
				<p>
					Magic Missile ({SPELL_DEFINITIONS["magic-missile"].cost} mana): Z
					selects the nearest visible monster within{" "}
					{SPELL_DEFINITIONS["magic-missile"].range} tiles and clear wall sight.
					Use arrows or WASD to cast at the nearest eligible monster straight in
					that direction. Enter or click casts at the highlighted monster. An
					empty direction costs no turn or mana. Escape or Z cancels for free.
					Horizontal and vertical distance count together. Other monsters do not
					block the bolt.
				</p>
				<p>
					Heal ({SPELL_DEFINITIONS.heal.cost} mana): H or its hotbar button
					casts on yourself, restoring health before monsters act. Full health
					and insufficient mana cost no turn.
				</p>
				<p>
					Intelligence improves spell damage, healing, and maximum mana. The
					Spells tab shows current effects. Future spells come from found
					spellbooks, never automatic level unlocks.
				</p>
			</section>
			<section
				aria-label="Character progression"
				className="rounded-lg border p-4 text-sm"
			>
				<h3 className="mb-2 font-medium">Experience and levels</h3>
				<p>
					Confirmed monster kills award XP. Each earned level adds{" "}
					{HEALTH_PER_LEVEL} maximum and current health without using another
					turn or granting a full heal. Character level is capped at{" "}
					{MAX_PLAYER_LEVEL}; XP keeps accumulating at the cap.
				</p>
				<p className="mt-2 text-muted-foreground">
					Strength adds to melee damage alongside your weapon. Dexterity
					improves accuracy and evasion; armor reduces damage after a hit lands.
					Attributes grow automatically at alternating levels, with no point
					allocation. Character shows the actual contributions and final
					chances.
				</p>
			</section>
			<p className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
				<Shield aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
				Opening Help, Settings, or Character does not use a turn.
			</p>
		</div>
	</SheetContent>
);
export default DungeonHelp;
