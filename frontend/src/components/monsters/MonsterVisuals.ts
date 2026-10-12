import { Bone, Dog, Rat, Skull } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { MONSTER_DEFINITIONS } from "../../domain/monsters/Monster";
import type { MonsterKind } from "../../domain/monsters/Monster.ts";
import BruteIcon from "./BruteIcon";
import GoblinArcherIcon from "./GoblinArcherIcon";
import GoblinIcon from "./GoblinIcon.tsx";
import KoboldSlingerIcon from "./KoboldSlingerIcon";
import SpiderIcon from "./SpiderIcon";

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
	"goblin-archer": {
		icon: GoblinArcherIcon,
		color: "text-monster-archer",
		label: MONSTER_DEFINITIONS["goblin-archer"].name,
	},
	"dungeon-brute": {
		icon: BruteIcon,
		color: "text-monster-brute",
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
	skeleton: {
		icon: Bone,
		color: "text-monster-undead",
		label: MONSTER_DEFINITIONS.skeleton.name,
	},
	zombie: {
		icon: Skull,
		color: "text-goblin",
		label: MONSTER_DEFINITIONS.zombie.name,
	},
	wolf: {
		icon: Dog,
		color: "text-monster-orc",
		label: MONSTER_DEFINITIONS.wolf.name,
	},
	"kobold-slinger": {
		icon: KoboldSlingerIcon,
		color: "text-monster-archer",
		label: MONSTER_DEFINITIONS["kobold-slinger"].name,
	},
	spider: {
		icon: SpiderIcon,
		color: "text-goblin",
		label: MONSTER_DEFINITIONS.spider.name,
	},
};
