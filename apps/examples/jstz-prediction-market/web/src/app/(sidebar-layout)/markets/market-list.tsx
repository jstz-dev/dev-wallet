"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { MarketCard } from "~/components/market-card";
import { env } from "~/env";
import { parentKvSchema } from "~/lib/validators/parentSf";
import { useJstzClient } from "~/providers/jstz-client.context";
import { smartFunctions } from "~/queries/smartFunctions.queries";

export function MarketList() {
  const { getJstzClient } = useJstzClient();
  const jstzClient = getJstzClient();

  const { data: parentKv } = useSuspenseQuery({
    ...smartFunctions.getKv(env.NEXT_PUBLIC_PARENT_SF_ADDRESS, "root", jstzClient),

    select: (data): { markets: Record<string, { address: string }> } => {
      if (!data) return { markets: {} };
      return parentKvSchema.parse(JSON.parse(data as string));
    },
  });

  const markets = Object.values(parentKv.markets);

  if (markets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <TrendingUp className="h-12 w-12 text-muted-foreground" />
        </div>

        <h3 className="text-xl font-semibold mb-2">No markets available</h3>
        <p className="text-muted-foreground max-w-md">
          There are no prediction markets in this category yet. Check back soon or explore other
          categories.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {markets.map((market) => (
        <Link
          href={`/markets/${market.address}`}
          key={market.address}
          className="self-stretch justify-self-stretch"
        >
          <MarketCard {...market} />
        </Link>
      ))}
    </div>
  );
}
