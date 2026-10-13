import type { SVGProps } from "react";

const ChampionIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="m6 8-1-5 4 2 3-3 3 3 4-2-1 5M6 8h12v7l-3 3H9l-3-3ZM7 18l-4 2v2h18v-2l-4-2" />
		<path d="m8 11 3 1m5-1-3 1M10 15h4M12 8v8" />
	</svg>
);
export default ChampionIcon;
