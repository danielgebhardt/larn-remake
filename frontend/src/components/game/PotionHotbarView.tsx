import { Button } from "@/components/ui/button";
import type { Bag } from "../../domain/items/Bag";
import { ITEM_DEFINITIONS } from "../../domain/items/Item";
import {
	HOTBAR_SLOTS,
	type HotbarSlot,
	hotbarSlotContents,
	type PotionHotbar,
	type PotionKind,
} from "../../domain/items/PotionHotbar";
import ItemIcon from "../items/ItemIcon";

const POTION_LABELS: Record<PotionKind, string> = {
	"healing-potion": "Health",
	"mana-potion": "Mana",
	antidote: "Antidote",
	"greater-healing-potion": "Greater heal",
	"greater-mana-potion": "Greater mana",
};
const PotionHotbarView = ({
	bag,
	potionHotbar,
	alive,
	onActivate,
}: {
	bag: Bag;
	potionHotbar: PotionHotbar;
	alive: boolean;
	onActivate: (slot: HotbarSlot) => void;
}) => (
	<section aria-label="Potion hotbar" className="flex items-start gap-1.5">
		{HOTBAR_SLOTS.map((slot) => {
			const { kind, count } = hotbarSlotContents({ bag, potionHotbar }, slot);
			const label = `Potion slot ${slot}: ${kind ? `${ITEM_DEFINITIONS[kind].name}, ${count} carried` : "empty"}`;
			return (
				<div key={slot} className="grid w-12 gap-1 text-center">
					<Button
						type="button"
						variant="outline"
						disabled={!alive}
						aria-label={label}
						title={label}
						onClick={() => onActivate(slot)}
						className="relative size-12 rounded-md p-2 dark:bg-background/60"
					>
						<kbd className="absolute top-0.5 left-1 text-[10px] leading-none text-muted-foreground">
							{slot}
						</kbd>
						{kind ? (
							<span className={`size-6 ${count === 0 ? "opacity-40" : ""}`}>
								<ItemIcon kind={kind} />
							</span>
						) : (
							<span aria-hidden="true" className="text-muted-foreground/40">
								—
							</span>
						)}
						{kind && (
							<span
								aria-hidden="true"
								className="absolute right-1 bottom-0.5 text-[10px] font-medium tabular-nums"
							>
								{count}
							</span>
						)}
					</Button>
					<span
						aria-hidden="true"
						className="line-clamp-2 min-h-6 text-[10px] leading-3 text-muted-foreground"
					>
						{kind ? POTION_LABELS[kind] : "Empty"}
					</span>
				</div>
			);
		})}
	</section>
);
export default PotionHotbarView;
