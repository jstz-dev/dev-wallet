import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { z } from "zod/mini";
import { MarketCard } from "~/components/market-card";
import { env } from "~/env";
import { createJstzClient } from "~/lib/jstz-signer.service";
import { marketSchema } from "~/lib/validators/market";
import { getQueryClient } from "~/providers/query-provider";
import { smartFunctions } from "~/queries/smartFunctions.queries";

const marketFromRoot = z.object({
  markets: z.record(
    z.string(),
    z.object({
      address: z.string().check(z.length(36)),
    }),
  ),
});

export default async function MarketsPage() {
  const queryClient = getQueryClient();
  const jstzClient = createJstzClient();

  const options = smartFunctions.getKv(env.NEXT_PUBLIC_PARENT_SF_ADDRESS, "root", jstzClient);

  await queryClient.prefetchQuery(options);

  const kv = await queryClient.getQueryData(options.queryKey);

  const markets = await (async () => {
    if (!kv) return [];

    const { data: marketsFromRoot, error } = marketFromRoot.safeParse(JSON.parse(kv));
    if (error) {
      throw error;
    }

    return Promise.all(
      Object.values(marketsFromRoot.markets).map(async ({ address }) => {
        const options = smartFunctions.getKv(address, "root", jstzClient);
        await queryClient.prefetchQuery(options);

        const kv = await queryClient.getQueryData(options.queryKey);
        return { ...marketSchema.parse(JSON.parse(kv)), address };
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
          {markets.length !== 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {markets.map((market) => (
                <Link href={`/markets/${market.address}`} key={market.address}>
                  <MarketCard {...market} />
                </Link>
              ))}
            </div>
          )}
        </HydrationBoundary>
      </div>
    </main>
  );
}
