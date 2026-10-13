import { Bone, Dog, Ghost, Rat, Skull } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { MONSTER_DEFINITIONS } from "../../domain/monsters/Monster";
import type { MonsterKind } from "../../domain/monsters/Monster.ts";
import BruteIcon from "./BruteIcon";
import ChargerIcon from "./ChargerIcon";
import CultistIcon from "./CultistIcon";
import FrostGiantIcon from "./FrostGiantIcon";
import GoblinArcherIcon from "./GoblinArcherIcon";
import GoblinIcon from "./GoblinIcon.tsx";
import GolemIcon from "./GolemIcon";
import KoboldSlingerIcon from "./KoboldSlingerIcon";
import NecromancerIcon from "./NecromancerIcon";
import SalamanderIcon from "./SalamanderIcon";
import SpiderIcon from "./SpiderIcon";
import WardenIcon from "./WardenIcon";
import WyvernIcon from "./WyvernIcon";

export const MONSTER_VISUALS: Record<
	MonsterKind,
	{
		icon: ComponentType<SVGProps<SVGSVGElement>>;
		color: string;
		label: string;
	}
> = {
	"horned-charger": {
		icon: ChargerIcon,
		color: "text-monster-orc",
		label: MONSTER_DEFINITIONS["horned-charger"].name,
	},
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
	ogre: {
		icon: BruteIcon,
		color: "text-monster-orc",
		label: MONSTER_DEFINITIONS.ogre.name,
	},
	troll: {
		icon: BruteIcon,
		color: "text-goblin",
		label: MONSTER_DEFINITIONS.troll.name,
	},
	cultist: {
		icon: CultistIcon,
		color: "text-monster-brute",
		label: MONSTER_DEFINITIONS.cultist.name,
	},
	"stone-golem": {
		icon: GolemIcon,
		color: "text-monster-undead",
		label: MONSTER_DEFINITIONS["stone-golem"].name,
	},
	wraith: {
		icon: Ghost,
		color: "text-monster-rat",
		label: MONSTER_DEFINITIONS.wraith.name,
	},
	wyvern: {
		icon: WyvernIcon,
		color: "text-goblin",
		label: MONSTER_DEFINITIONS.wyvern.name,
	},
	salamander: {
		icon: SalamanderIcon,
		color: "text-monster-orc",
		label: MONSTER_DEFINITIONS.salamander.name,
	},
	"frost-giant": {
		icon: FrostGiantIcon,
		color: "text-monster-archer",
		label: MONSTER_DEFINITIONS["frost-giant"].name,
	},
	necromancer: {
		icon: NecromancerIcon,
		color: "text-monster-undead",
		label: MONSTER_DEFINITIONS.necromancer.name,
	},
	"demon-warden": {
		icon: WardenIcon,
		color: "text-monster-brute",
		label: MONSTER_DEFINITIONS["demon-warden"].name,
	},
};
