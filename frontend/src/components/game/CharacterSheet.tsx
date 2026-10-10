import { Heart, Shield, Sword, UserRound } from "lucide-react";
import {
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import type { PlayerStats } from "../../domain/game/PlayerStats";
import type { Equipment } from "../../domain/items/Equipment";
import { ITEM_DEFINITIONS } from "../../domain/items/Item";

type CharacterSheetProps = { player: PlayerStats; equipment: Equipment };

const slots = [
	{ key: "mainHand", label: "Main hand", Icon: Sword },
	{ key: "offHand", label: "Off hand", Icon: Shield },
] as const;

const CharacterSheet = ({ player, equipment }: CharacterSheetProps) => (
	<SheetContent className="overflow-y-auto data-[side=right]:w-full">
		<SheetHeader>
			<SheetTitle>Character</SheetTitle>
			<SheetDescription>Your health and equipped gear.</SheetDescription>
		</SheetHeader>
		<div className="grid gap-6 px-4 pb-6">
			<div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
				<Heart aria-hidden="true" className="size-5 text-player" />
				<output
					aria-label="Character health"
					className="font-medium tabular-nums"
				>
					Health {player.health} / {player.maxHealth}
				</output>
			</div>
			<section
				aria-labelledby="character-equipment-title"
				className="grid gap-3"
			>
				<h3
					id="character-equipment-title"
					className="flex items-center gap-2 font-medium"
				>
					<UserRound
						aria-hidden="true"
						className="size-4 text-muted-foreground"
					/>
					Equipment
				</h3>
				{slots.map(({ key, label, Icon }) => {
					const item = equipment[key];
					const definition = item ? ITEM_DEFINITIONS[item.kind] : null;
					return (
						<section
							key={key}
							aria-labelledby={`character-${key}`}
							className="rounded-lg border bg-muted/30 p-4"
						>
							<div className="flex items-center gap-3">
								<span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background">
									<Icon
										aria-hidden="true"
										className="size-5 text-muted-foreground"
									/>
								</span>
								<div className="min-w-0">
									<h4
										id={`character-${key}`}
										className="text-xs font-medium text-muted-foreground"
									>
										{label}
									</h4>
									<p className="mt-1 font-medium">
										{definition?.name ?? `${label} empty`}
									</p>
								</div>
							</div>
							{definition && (
								<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
									{definition.description}
								</p>
							)}
						</section>
					);
				})}
			</section>
			<p className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
				This view is read-only. Opening it does not use a turn.
			</p>
		</div>
	</SheetContent>
);

export default CharacterSheet;
