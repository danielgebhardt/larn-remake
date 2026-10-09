import { RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type HeaderProps = {
	floorNumber: number;
	floorCount: number;
	onNewDungeon: () => void;
	settingsAction?: ReactNode;
};

const Header = ({
	floorNumber,
	floorCount,
	onNewDungeon,
	settingsAction,
}: HeaderProps) => {
	return (
		<header className="flex flex-wrap items-center gap-4 border-b border-border bg-card px-4 py-3 sm:px-6">
			<div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-4 gap-y-1">
				<h1 className="text-lg font-semibold tracking-tight">Larn Remake</h1>
				<h2 className="text-sm font-medium text-muted-foreground">
					Floor {floorNumber} of {floorCount}
				</h2>
			</div>
			<Button type="button" onClick={onNewDungeon}>
				<RefreshCw aria-hidden="true" focusable="false" />
				New Dungeon
			</Button>
			{settingsAction}
		</header>
	);
};

export default Header;
