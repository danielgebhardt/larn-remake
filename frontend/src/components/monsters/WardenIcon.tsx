import type { SVGProps } from "react";

const WardenIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="M6 8 2 2l8 4h4l8-4-4 6v9l-6 5-6-5ZM8 10l3 2m5-2-3 2M9 16h6m-6 0 1 3m4-3-1 3" />
	</svg>
);
export default WardenIcon;
