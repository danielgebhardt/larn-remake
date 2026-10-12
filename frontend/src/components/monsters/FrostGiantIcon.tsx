import type { SVGProps } from "react";

const FrostGiantIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="M5 8 3 3l6 3h6l6-3-2 5v8l-4 4H9l-4-4ZM8 10h2m4 0h2M9 15h6M12 2v4m-2-3 4 2m-4 0 4-2M3 22h18" />
	</svg>
);
export default FrostGiantIcon;
