import type { SVGProps } from "react";

const OgreIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="M5 8 3 5l4 1q5-4 10 0l4-1-2 3v8l-4 5H9l-4-5ZM8 10h2m4 0h2M9 16h6M10 13h4" />
		<path d="M12 3v5M5 12H2v5h3m14-5h3v5h-3M10 19h4" />
	</svg>
);
export default OgreIcon;
