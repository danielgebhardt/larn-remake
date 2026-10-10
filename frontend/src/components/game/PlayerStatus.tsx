const PlayerStatus = ({ turn }: { turn: number }) => (
	<section
		aria-label="Player status"
		className="flex shrink-0 flex-wrap items-center justify-center gap-x-6 gap-y-2 pb-2 text-sm tabular-nums"
	>
		<output aria-label="Turn count">Turn {turn}</output>
	</section>
);

export default PlayerStatus;
