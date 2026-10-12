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
	// Provisional art until the tactical presentation story (#150).
	"goblin-archer": {
		icon: GoblinIcon,
		color: "text-goblin",
		label: MONSTER_DEFINITIONS["goblin-archer"].name,
	},
	// Provisional art until #150; seeded rollout remains disabled.
	"dungeon-brute": {
		icon: Skull,
		color: "text-monster-orc",
		label: MONSTER_DEFINITIONS["dungeon-brute"].name,
	},
	"giant-rat": {
		icon: Rat,
		color: "text-monster-rat",
		label: MONSTER_DEFINITIONS["giant-rat"].name,
	},
	orc: {
		icon: Skull,
		color: "text-monster-orc",
		label: MONSTER_DEFINITIONS.orc.name,
	},
};
