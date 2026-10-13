import type { SVGProps } from "react";

const FountainIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="M3 12h18c-1 4-5 5-9 5s-8-1-9-5ZM12 17v5M7 22h10M12 12V3M12 7c-3-5-6-4-6-1M12 7c3-5 6-4 6-1" />
	</svg>
);
export default FountainIcon;
