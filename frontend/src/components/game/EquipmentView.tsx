import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PlayerAction } from "../../domain/game/PlayerActions";
import type { Equipment, EquipmentSlot } from "../../domain/items/Equipment";
import { ITEM_DEFINITIONS } from "../../domain/items/Item";
import ItemIcon from "../items/ItemIcon";
import ItemDetails from "./ItemDetails";

const slots = [
	{ key: "mainHand", label: "Main hand" },
	{ key: "offHand", label: "Off hand" },
] as const;
const EquipmentView = ({
	equipment,
	alive,
	onAction,
}: {
	equipment: Equipment;
	alive: boolean;
	onAction: (action: PlayerAction) => void;
}) => {
	const [selection, setSelection] = useState<{
		slot: EquipmentSlot;
		id: string;
	} | null>(null);
	const headingRef = useRef<HTMLHeadingElement>(null);
	const selected =
		selection && equipment[selection.slot]?.id === selection.id
			? equipment[selection.slot]
			: null;
	return (
		<section
			aria-labelledby="character-equipment-title"
			className="grid content-start gap-3"
		>
			<h3
				ref={headingRef}
				tabIndex={-1}
				id="character-equipment-title"
				className="font-medium outline-none"
			>
				Equipment
			</h3>
			<div className="grid min-h-64 grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] items-center gap-2 rounded-lg border bg-muted/20 p-3">
				{slots.map(({ key, label }, index) => (
					<section
						key={key}
						aria-labelledby={`character-${key}`}
						className={
							index === 0
								? "col-start-1 row-start-1"
								: "col-start-3 row-start-1"
						}
					>
						<h4
							id={`character-${key}`}
							className="mb-2 text-center text-xs text-muted-foreground"
						>
							{label}
						</h4>
						<Button
							type="button"
							variant="outline"
							aria-label={`${label}: ${equipment[key] ? ITEM_DEFINITIONS[equipment[key].kind].name : "empty"}`}
							aria-pressed={
								selected?.id === equipment[key]?.id && selected !== null
							}
							onClick={() =>
								setSelection(
									equipment[key] ? { slot: key, id: equipment[key].id } : null,
								)
							}
							className="grid h-auto min-h-24 w-full justify-items-center gap-2 whitespace-normal p-2 text-center aria-pressed:border-primary aria-pressed:bg-primary/10"
						>
							{equipment[key] ? (
								<>
									<span className="size-7">
										<ItemIcon kind={equipment[key].kind} />
									</span>
									<span className="text-xs">
										{ITEM_DEFINITIONS[equipment[key].kind].name}
									</span>
								</>
							) : (
								<span className="text-xs text-muted-foreground">
									{label} empty
								</span>
							)}
						</Button>
					</section>
				))}
				<svg
					aria-hidden="true"
					focusable="false"
					viewBox="0 0 120 220"
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					strokeLinejoin="round"
					className="col-start-2 row-start-1 w-full text-muted-foreground/50"
				>
					<circle cx="60" cy="24" r="17" />
					<path d="M45 50H75L95 62L110 119L96 123L80 82V132L87 202H69L60 152L51 202H33L40 132V82L24 123L10 119L25 62Z" />
				</svg>
			</div>
			{selected && selection ? (
				<ItemDetails
					item={selected}
					equippedSlot={selection.slot}
					alive={alive}
					onAction={onAction}
					afterAction={() => headingRef.current?.focus({ preventScroll: true })}
				/>
			) : (
				<p className="text-xs text-muted-foreground">
					Select equipped gear to inspect it.
				</p>
			)}
		</section>
	);
};
export default EquipmentView;
