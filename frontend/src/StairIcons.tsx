import type { SVGProps } from "react";

type StairIconProps = SVGProps<SVGSVGElement>;

const Staircase = ({
	descending,
	...props
}: StairIconProps & { descending: boolean }) => {
	const heights = descending ? [16, 12, 8, 4] : [4, 8, 12, 16];

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
			focusable="false"
			{...props}
		>
			{heights.map((height, index) => (
				<rect
					key={height}
					x={4 + index * 4}
					y={20 - height}
					width="4"
					height={height}
				/>
			))}
		</svg>
	);
};

export const StairsUpIcon = (props: StairIconProps) => (
	<Staircase {...props} descending={false} />
);

export const StairsDownIcon = (props: StairIconProps) => (
	<Staircase {...props} descending={true} />
);
