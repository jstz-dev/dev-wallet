import { Badge } from "jstz-ui/ui/badge";
import { Market } from "~/lib/validators/market";

export function StateBadge({ state }: { state: Market["state"] }) {
  switch (state) {
    case "on-going":
      return <Badge className="text-xs">Active</Badge>;

    case "waiting-for-resolution":
      return (
        <Badge variant="warning" className="text-xs">
          Waiting for Resolution
        </Badge>
      );

    case "resolved":
      return (
        <Badge variant="destructive" className="text-xs">
          Resolved
        </Badge>
      );

    case "closed":
      return (
        <Badge variant="destructive" className="text-xs">
          Closed
        </Badge>
      );

    case "created":
      return (
        <Badge variant="outline" className=" text-xs">
          Inactive
        </Badge>
      );
  }
}
