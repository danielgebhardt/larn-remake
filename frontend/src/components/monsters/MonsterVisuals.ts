import { Rat, Skull } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { MONSTER_DEFINITIONS } from "../../domain/monsters/Monster";
import type { MonsterKind } from "../../domain/monsters/Monster.ts";
import GoblinIcon from "./GoblinIcon.tsx";

export const MONSTER_VISUALS: Record<
	MonsterKind,
	{
		icon: ComponentType<SVGProps<SVGSVGElement>>;
		color: string;
		label: string;
	}
> = {
	goblin: {
		icon: GoblinIcon,
		color: "text-goblin",
		label: MONSTER_DEFINITIONS.goblin.name,
	},
	"giant-rat": {
		icon: Rat,
		color: "text-amber-600 dark:text-amber-300",
		label: MONSTER_DEFINITIONS["giant-rat"].name,
	},
	orc: {
		icon: Skull,
		color: "text-rose-700 dark:text-rose-300",
		label: MONSTER_DEFINITIONS.orc.name,
	},
};
