import { Bone, Dog, Ghost, Rat, Skull } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { MONSTER_DEFINITIONS } from "../../domain/monsters/Monster";
import type { MonsterKind } from "../../domain/monsters/Monster.ts";
import BruteIcon from "./BruteIcon";
import ChampionIcon from "./ChampionIcon";
import ChargerIcon from "./ChargerIcon";
import CultistIcon from "./CultistIcon";
import FrostGiantIcon from "./FrostGiantIcon";
import GoblinArcherIcon from "./GoblinArcherIcon";
import GoblinIcon from "./GoblinIcon.tsx";
import GolemIcon from "./GolemIcon";
import KoboldSlingerIcon from "./KoboldSlingerIcon";
import NecromancerIcon from "./NecromancerIcon";
import OgreIcon from "./OgreIcon";
import SalamanderIcon from "./SalamanderIcon";
import SentryIcon from "./SentryIcon";
import SpiderIcon from "./SpiderIcon";
import TrollIcon from "./TrollIcon";
import WardenIcon from "./WardenIcon";
import WyvernIcon from "./WyvernIcon";
import ZombieIcon from "./ZombieIcon";

export const MONSTER_VISUALS: Record<
	MonsterKind,
	{
		icon: ComponentType<SVGProps<SVGSVGElement>>;
		color: string;
		label: string;
	}
> = {
	"iron-champion": {
		icon: ChampionIcon,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS["iron-champion"].name,
	},
	"alarm-sentry": {
		icon: SentryIcon,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS["alarm-sentry"].name,
	},
	"horned-charger": {
		icon: ChargerIcon,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS["horned-charger"].name,
	},
	goblin: {
		icon: GoblinIcon,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS.goblin.name,
	},
	"goblin-archer": {
		icon: GoblinArcherIcon,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS["goblin-archer"].name,
	},
	"dungeon-brute": {
		icon: BruteIcon,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS["dungeon-brute"].name,
	},
	"giant-rat": {
		icon: Rat,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS["giant-rat"].name,
	},
	orc: {
		icon: Skull,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS.orc.name,
	},
	skeleton: {
		icon: Bone,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS.skeleton.name,
	},
	zombie: {
		icon: ZombieIcon,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS.zombie.name,
	},
	wolf: {
		icon: Dog,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS.wolf.name,
	},
	"kobold-slinger": {
		icon: KoboldSlingerIcon,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS["kobold-slinger"].name,
	},
	spider: {
		icon: SpiderIcon,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS.spider.name,
	},
	ogre: {
		icon: OgreIcon,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS.ogre.name,
	},
	troll: {
		icon: TrollIcon,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS.troll.name,
	},
	cultist: {
		icon: CultistIcon,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS.cultist.name,
	},
	"stone-golem": {
		icon: GolemIcon,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS["stone-golem"].name,
	},
	wraith: {
		icon: Ghost,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS.wraith.name,
	},
	wyvern: {
		icon: WyvernIcon,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS.wyvern.name,
	},
	salamander: {
		icon: SalamanderIcon,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS.salamander.name,
	},
	"frost-giant": {
		icon: FrostGiantIcon,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS["frost-giant"].name,
	},
	necromancer: {
		icon: NecromancerIcon,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS.necromancer.name,
	},
	"demon-warden": {
		icon: WardenIcon,
		color: "text-monster-icon",
		label: MONSTER_DEFINITIONS["demon-warden"].name,
	},
};
