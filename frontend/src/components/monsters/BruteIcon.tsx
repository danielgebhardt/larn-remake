import type { SVGProps } from "react";

// Broad shoulders and a square, tusked jaw distinguish the brute at tile size.
const BruteIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="M6 7 4 3l5 2h6l5-2-2 4M6 7h12v7l-3 3H9l-3-3Z" />
		<path d="m8 9 3 1m5-1-3 1M9 13l1 3 1-3m2 0 1 3 1-3M7 17l-4 2v3h18v-3l-4-2" />
	</svg>
);
export default BruteIcon;
