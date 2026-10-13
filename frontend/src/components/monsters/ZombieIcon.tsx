import type { SVGProps } from "react";

const ZombieIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="M7 3h10l2 4-1 11-6 4-6-4L5 7ZM8 3v4h4V3M9 18v3m6-3v3" />
		<circle cx="9" cy="11" r="1" />
		<path d="m14 10 3 2m0-2-3 2M8 16l8-1m-5-1v3m3-3v3" />
	</svg>
);
export default ZombieIcon;
