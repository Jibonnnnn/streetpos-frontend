import { Button } from "@/components/ui/button";
import { BadgePill } from "@/components/common/BadgePill";
import { Globe } from "lucide-react";

export type PosTab = "pos" | "online" | "tabs";

type Props = {
  tab: PosTab;
  onChange: (tab: PosTab) => void;
  onlineCount?: number;
  tabsCount?: number;
  isOnline: boolean;
};

export function PosTabBar({
  tab,
  onChange,
  onlineCount = 0,
  tabsCount = 0,
  isOnline,
}: Props) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <Button
        variant={tab === "pos" ? "default" : "outline"}
        className="rounded-2xl"
        onClick={() => onChange("pos")}
      >
        POS
      </Button>
      <Button
        variant={tab === "online" ? "default" : "outline"}
        className="rounded-2xl"
        onClick={() => onChange("online")}
        disabled={!isOnline}
        title={!isOnline ? "Needs internet connection" : undefined}
      >
        <Globe className="mr-2 h-4 w-4" />
        Online Orders
        {onlineCount > 0 && (
          <BadgePill tone="info" className="ml-2">
            {onlineCount}
          </BadgePill>
        )}
      </Button>
      <Button
        variant={tab === "tabs" ? "default" : "outline"}
        className="rounded-2xl"
        onClick={() => onChange("tabs")}
        disabled={!isOnline}
        title={!isOnline ? "Needs internet connection" : undefined}
      >
        Open Tabs
        {tabsCount > 0 && (
          <BadgePill tone="warning" className="ml-2">
            {tabsCount}
          </BadgePill>
        )}
      </Button>
    </div>
  );
}