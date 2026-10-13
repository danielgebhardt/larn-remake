import type { SVGProps } from "react";

const PoisonDartIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="m4 20 10-10m-3 1 2 2M14 10l7-7-1 6-5 2ZM3 14l4 3 3 4M3 14v7h7" />
		<path
			d="M6 2c0 3-3 4-3 6a3 3 0 0 0 6 0c0-2-3-3-3-6Z"
			fill="currentColor"
			fillOpacity=".15"
		/>
	</svg>
);
export default PoisonDartIcon;
