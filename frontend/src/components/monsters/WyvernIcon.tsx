import type { SVGProps } from "react";

const WyvernIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="M10 8 3 3 1 14l8-3M14 8l7-5 2 11-8-3M9 7l3-5 3 5-1 6-2 3-2-3ZM12 16v5l-4 2m4-2 4 2M11 8h.1m2 0h.1" />
	</svg>
);
export default WyvernIcon;
