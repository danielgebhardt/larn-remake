import type { SVGProps } from "react";

const DragonMailIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="M7 3h10l4 5-3 3v10H6V11L3 8ZM9 3v3q3 4 6 0V3" />
		<path d="m9 11 3 2 3-2m-6 4 3 2 3-2M4 7l3 2m13-2-3 2" />
	</svg>
);
export default DragonMailIcon;
