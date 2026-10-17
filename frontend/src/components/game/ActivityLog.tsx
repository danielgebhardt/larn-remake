import { BookOpenText, ChevronDown, ScrollText } from "lucide-react";
import { memo, useCallback, useLayoutEffect, useRef, useState } from "react";
import type { ActivityHistory } from "../../domain/game/ActivityHistory.ts";
import ActivityMessage from "./ActivityMessage";

const messageBounds = (entry: HTMLElement) =>
	(
		entry.querySelector<HTMLElement>("[data-activity-message]") ?? entry
	).getBoundingClientRect();

const ActivityLog = memo(function ActivityLog({
	history,
	resetKey,
}: {
	history: ActivityHistory;
	resetKey?: object;
}) {
	const viewportRef = useRef<HTMLDivElement>(null);
	const following = useRef(true);
	const [isFollowing, setIsFollowing] = useState(true);
	const pausedAt = useRef(history.nextId);
	const previousNextId = useRef(history.nextId);
	const previousResetKey = useRef(resetKey);
	const size = useRef<{ width: number; height: number } | undefined>(undefined);
	const anchor = useRef<{ id: string; offset: number } | undefined>(undefined);

	const rememberAnchor = useCallback(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		const top = viewport.getBoundingClientRect().top + viewport.clientTop;
		const entry = Array.from(
			viewport.querySelectorAll<HTMLElement>("[data-entry-id]"),
		).find((item) => messageBounds(item).bottom > top);

		anchor.current = entry
			? {
					id: entry.dataset.entryId ?? "",
					offset: messageBounds(entry).top - top,
				}
			: undefined;
	}, []);

	const alignViewport = useCallback(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		if (following.current) {
			viewport.scrollTop = Math.max(
				0,
				viewport.scrollHeight - viewport.clientHeight,
			);
		} else if (anchor.current) {
			const previous = anchor.current;
			const entry = Array.from(
				viewport.querySelectorAll<HTMLElement>("[data-entry-id]"),
			).find((item) => item.dataset.entryId === previous.id);

			if (entry) {
				const top = viewport.getBoundingClientRect().top + viewport.clientTop;
				viewport.scrollTop += messageBounds(entry).top - top - previous.offset;
			} else {
				viewport.scrollTop = 0;
			}
		}

		rememberAnchor();
		size.current = {
			width: viewport.clientWidth,
			height: viewport.clientHeight,
		};
	}, [rememberAnchor]);

	useLayoutEffect(() => {
		if (
			resetKey !== previousResetKey.current ||
			history.nextId === 0 ||
			history.nextId < previousNextId.current
		) {
			following.current = true;
			setIsFollowing(true);
			pausedAt.current = history.nextId;
		}

		alignViewport();
		previousNextId.current = history.nextId;
		previousResetKey.current = resetKey;
	}, [history, alignViewport, resetKey]);

	useLayoutEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport || typeof ResizeObserver === "undefined") return;

		const observer = new ResizeObserver(alignViewport);
		observer.observe(viewport);

		return () => observer.disconnect();
	}, [alignViewport]);

	const jumpToLatest = () => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		following.current = true;
		setIsFollowing(true);
		viewport.scrollTop = Math.max(
			0,
			viewport.scrollHeight - viewport.clientHeight,
		);
		viewport.focus({ preventScroll: true });
		rememberAnchor();
	};

	const latestTurn = history.entries.at(-1)?.event.turn;

	return (
		<section
			aria-labelledby="activity-title"
			className="
            ember-panel flex min-h-0 min-w-0 flex-col overflow-hidden
            rounded-lg border border-border bg-card shadow-sm
            dark:border-amber-900/25
         "
		>
			{/* Journal header */}
			<div
				className="
               relative flex shrink-0 items-center justify-between
               gap-2 border-b border-border/70
               bg-gradient-to-b from-muted/50 to-card
               px-3 py-2.5
               dark:border-amber-900/30
               dark:from-muted dark:to-card
            "
			>
				<div className="flex min-w-0 items-center gap-2">
					<ScrollText
						aria-hidden="true"
						className="size-5 text-amber-700 dark:text-amber-400"
						strokeWidth={1.7}
					/>

					<h2
						id="activity-title"
						className="font-serif text-base font-semibold tracking-wide"
					>
						Activity
					</h2>
				</div>

				{isFollowing ? (
					<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<span
							aria-hidden="true"
							className="size-1.5 rounded-full bg-emerald-500"
						/>
						Following
					</span>
				) : (
					<button
						type="button"
						className="
                     inline-flex items-center gap-1 rounded-md
                     border border-primary/30 bg-primary/10
                     px-2 py-1 text-xs font-medium text-primary
                     hover:bg-primary/20
                     focus-visible:outline-2 focus-visible:outline-ring
                  "
						aria-label={`Jump to latest activity${
							history.nextId > pausedAt.current
								? `, ${history.nextId - pausedAt.current} new ${
										history.nextId - pausedAt.current === 1 ? "event" : "events"
									}`
								: ""
						}`}
						onClick={jumpToLatest}
					>
						<ChevronDown aria-hidden="true" className="size-3.5" />
						Latest
						{history.nextId > pausedAt.current
							? ` · ${history.nextId - pausedAt.current} new`
							: ""}
					</button>
				)}
			</div>

			{/* Subtle engraved line */}
			<div
				aria-hidden="true"
				className="
               h-px shrink-0
               bg-gradient-to-r from-transparent
               via-amber-700/40 to-transparent
               dark:via-amber-500/35
            "
			/>

			{/* Scrollable journal */}
			<div
				ref={viewportRef}
				role="log"
				aria-label="Activity log"
				aria-live="polite"
				aria-relevant="additions"
				aria-atomic="false"
				// biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll the activity history.
				tabIndex={0}
				className="
               ember-surface h-[clamp(5rem,16dvh,9rem)]
               min-h-0 overflow-y-auto bg-card px-3 py-2
               text-[13px] leading-5
               [overflow-anchor:none]
               focus-visible:outline-2 focus-visible:-outline-offset-2
               focus-visible:outline-ring
               lg:h-auto lg:flex-1 lg:mb-2
            "
				onScroll={() => {
					const viewport = viewportRef.current;
					if (!viewport) return;

					if (
						size.current &&
						(size.current.width !== viewport.clientWidth ||
							size.current.height !== viewport.clientHeight)
					) {
						alignViewport();
						return;
					}

					const nextFollowing =
						viewport.scrollHeight -
							viewport.clientHeight -
							viewport.scrollTop <=
						2;

					if (following.current && !nextFollowing)
						pausedAt.current = history.nextId;

					following.current = nextFollowing;
					setIsFollowing(nextFollowing);
					rememberAnchor();
				}}
			>
				{history.entries.length === 0 ? (
					<div
						className="
                     flex min-h-36 flex-col items-center
                     justify-center gap-3 text-center
                     text-muted-foreground
                  "
					>
						<BookOpenText
							aria-hidden="true"
							className="size-9 text-amber-700/35 dark:text-amber-400/30"
							strokeWidth={1.3}
						/>
						<p className="text-sm">No activity yet.</p>
						<p className="max-w-48 text-xs">
							Your adventure will be recorded here.
						</p>
					</div>
				) : (
					<ol>
						{history.entries.map((entry, index) => {
							const newTurn =
								index === 0 ||
								history.entries[index - 1].event.turn !== entry.event.turn;

							const isLatestTurn = entry.event.turn === latestTurn;

							return (
								<li key={entry.id} data-entry-id={entry.id} className="py-0.5">
									{newTurn && (
										<h3
											className={`
                                    mb-1 mt-2.5 flex items-center gap-2
                                    border-t pt-2 text-[11px] font-semibold
                                    tracking-wide
                                    ${
																			isLatestTurn
																				? "border-amber-700/35 text-amber-900 dark:border-amber-500/35 dark:text-amber-300"
																				: "border-border/55 text-amber-800/80 dark:text-amber-400/75"
																		}
                                 `}
										>
											<span
												aria-hidden="true"
												className={`
                                       size-1.5 rotate-45
                                       ${
																					isLatestTurn
																						? "bg-amber-600 dark:bg-amber-400"
																						: "bg-amber-600/45 dark:bg-amber-400/50"
}
                                    `}
											/>
											Turn {entry.event.turn}
											{isLatestTurn && (
												<span
													aria-hidden="true"
													className="
                                          ml-auto rounded-sm bg-amber-700/10
                                          px-1.5 py-0.5 text-[9px] font-medium
                                          uppercase tracking-wider
                                          text-amber-800/75
                                          dark:bg-amber-400/10
                                          dark:text-amber-300/75
                                       "
												>
													Current
												</span>
											)}
										</h3>
									)}

									<div data-activity-message>
										<ActivityMessage event={entry.event} showTurn={false} />
									</div>
								</li>
							);
						})}
					</ol>
				)}
			</div>
		</section>
	);
});

export default ActivityLog;
