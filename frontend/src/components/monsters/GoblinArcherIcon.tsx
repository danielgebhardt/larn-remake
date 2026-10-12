import type { SVGProps } from "react";

// Keep the goblin face dominant so the archer reads as a creature, not loot.
const GoblinArcherIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		aria-hidden="true"
		focusable="false"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.8"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<g transform="translate(-.5 1) scale(.78)">
			<path d="m6 7-4-2 2 7 2 1m10-6 4-2-2 7-2 1M6 6q5-3 10 0v8q0 6-5 6t-5-6Z" />
			<path d="m7 10 3 1m5-1-3 1M8 15h6m-5 0 1 3 1-3" />
		</g>
		<path d="M18 3q8 9 0 18V3m-3 9h7m-2-2 2 2-2 2" />
	</svg>
);

export default GoblinArcherIcon;
