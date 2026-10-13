import type { SVGProps } from "react";

const WebIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="M12 2v20M2 12h20M4 4l16 16M4 20 20 4" />
		<path d="M12 4Q14 7 18 6Q17 10 20 12Q17 14 18 18Q14 17 12 20Q10 17 6 18Q7 14 4 12Q7 10 6 6Q10 7 12 4ZM12 8Q13 10 15 9Q14 11 16 12Q14 13 15 15Q13 14 12 16Q11 14 9 15Q10 13 8 12Q10 11 9 9Q11 10 12 8Z" />
	</svg>
);
export default WebIcon;
