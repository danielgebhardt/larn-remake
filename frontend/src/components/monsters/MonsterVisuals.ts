import type { ComponentType, SVGProps } from "react";
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
	goblin: { icon: GoblinIcon, color: "text-goblin", label: "goblin" },
};
