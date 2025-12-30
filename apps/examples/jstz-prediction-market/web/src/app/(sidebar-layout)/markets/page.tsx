import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { isPast } from "date-fns";
import { TrendingUp } from "lucide-react";
import { env } from "~/env";
import { createJstzClient } from "~/lib/jstz-signer.service";
import { marketSchema } from "~/lib/validators/market";
import { parentKvSchema } from "~/lib/validators/parentSf";
import { getQueryClient } from "~/providers/query-provider";
import { accounts } from "~/queries/account.queries";
import { smartFunctions } from "~/queries/smartFunctions.queries";
import { MarketList } from "./market-list";

export default async function MarketPage() {
  const queryClient = getQueryClient();
  const jstzClient = createJstzClient();

  const options = smartFunctions.getKv(env.NEXT_PUBLIC_PARENT_SF_ADDRESS, "root", jstzClient);

  await queryClient.prefetchQuery(options);

  const kv = await queryClient.getQueryData(options.queryKey);

  const markets = await (async () => {
    if (!kv) return [];

    const { data: parentKv, error } = parentKvSchema.safeParse(JSON.parse(kv as string));
    if (error) {
      throw error;
    }

    const marketsFromRoot = Object.values(parentKv.markets);

    return Promise.all(
      marketsFromRoot.map(async ({ address }) => {
        const options = smartFunctions.getKv(address, "root", jstzClient);
        await queryClient.prefetchQuery(options);

        void queryClient.prefetchQuery(accounts.balance(address, jstzClient));

        const kv = await queryClient.getQueryData(options.queryKey);

        const market = { ...marketSchema.parse(JSON.parse(kv as string)), address };

        const isWaitingForResolution =
          market.state !== "resolved" && market.state !== "closed" && isPast(market.resolutionDate);

        if (isWaitingForResolution) {
          market.state = "waiting-for-resolution";
        }

        return market;
      }),
    );
  })();

  return (
    <main className="flex-1">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Markets</h1>

          <p className="mt-2 text-muted-foreground">
            Show you&apos;re an expert. Trade on the outcomes of future events.
          </p>
        </div>

        {markets.length === 0 && (
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
        )}

        <HydrationBoundary state={dehydrate(queryClient)}>
          <MarketList />
        </HydrationBoundary>
      </div>
    </main>
  );
}
