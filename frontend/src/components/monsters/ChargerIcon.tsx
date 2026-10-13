import type { SVGProps } from "react";

const ChargerIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="M7 8 3 3v7l4 3M17 8l4-5v7l-4 3M7 8h10l2 8-4 5H9l-4-5Z" />
		<path d="m8 12 2 1m6-1-2 1M9 17h6m-4 1v1m2-1v1" />
	</svg>
);
export default ChargerIcon;
