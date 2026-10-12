import type { SVGProps } from "react";

const SpiderIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<ellipse cx="12" cy="14" rx="3" ry="5" />
		<circle cx="12" cy="7" r="2" />
		<path d="M9 10 5 7 3 3M15 10 19 7 21 3M9 12 4 10 1 9M15 12 20 10 23 9M9 15 4 16 1 18M15 15 20 16 23 18M9 17 5 20 4 23M15 17 19 20 20 23" />
	</svg>
);
export default SpiderIcon;
