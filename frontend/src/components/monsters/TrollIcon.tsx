import type { SVGProps } from "react";

const TrollIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="m6 7-3-3 1 9 3 2m11-8 3-3-1 9-3 2M7 7l1-5 4 2 4-2 1 5v10l-5 5-5-5Z" />
		<path d="m8 9 2 1m6-1-2 1M12 10l-2 5h4M9 18h6m-6-1v3m6-3v3" />
	</svg>
);
export default TrollIcon;
