import type { SVGProps } from "react";

const EmberIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path
			d="M12 2c1 5-5 6-5 11a5 5 0 0 0 10 0c0-2-1-4-3-6 0 3-2 4-2 4s2-5 0-9Z"
			fill="currentColor"
			fillOpacity=".16"
		/>
		<path d="m6 18 6-3 6 3-2 4H8Z" fill="currentColor" fillOpacity=".35" />
		<path d="m12 15 1 4-5 3m5-3 3 3" />
	</svg>
);
export default EmberIcon;
