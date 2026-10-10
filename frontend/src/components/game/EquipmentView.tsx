import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import type { Equipment, EquipmentSlot } from "../../domain/items/Equipment";
import { ITEM_DEFINITIONS } from "../../domain/items/Item";
import ItemIcon from "../items/ItemIcon";

const slots = [
	{ key: "mainHand", label: "Main hand" },
	{ key: "offHand", label: "Off hand" },
] as const;
const EquipmentView = ({
	equipment,
	selectedId,
	onSelect,
	headingRef,
}: {
	equipment: Equipment;
	selectedId: string | null;
	onSelect: (slot: EquipmentSlot) => void;
	headingRef: RefObject<HTMLHeadingElement | null>;
}) => {
	return (
		<section
			aria-labelledby="character-equipment-title"
			className="grid content-start gap-3 md:sticky md:top-0"
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
								selectedId === equipment[key]?.id && selectedId !== null
							}
							onClick={() => onSelect(key)}
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
		</section>
	);
};
export default EquipmentView;
