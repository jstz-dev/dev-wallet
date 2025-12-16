import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { z } from "zod/mini";
import { MarketCard } from "~/components/market-card";
import { env } from "~/env";
import { createJstzClient } from "~/lib/jstz-signer.service";
import { marketSchema } from "~/lib/validators/market";

const marketFromRoot = z.object({
  markets: z.record(
    z.string(),
    z.object({
      address: z.string().check(z.length(36)),
    }),
  ),
});

export default async function MarketsPage() {
  const jstzClient = createJstzClient();
  const kv = await jstzClient.accounts
    .getKv(env.NEXT_PUBLIC_PARENT_SF_ADDRESS, { key: "root" })
    .then((value): unknown => JSON.parse(value))
    .catch((e) => {
      if (!(e instanceof Error)) throw e;

      // If kv returns as 404 there is either the SF address is wrong or
      // there are no markets
      if (e.message.includes("404")) return { markets: {} };
    });

  const { data: marketsFromRoot, error } = marketFromRoot.safeParse(kv);
  if (error) {
    throw error;
  }

  const markets = await Promise.all(
    Object.values(marketsFromRoot.markets).map(async ({ address }) => {
      const kv = await jstzClient.accounts.getKv(address, { key: "root" });

      return { ...marketSchema.parse(JSON.parse(kv)), address };
    }),
  );

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

        {markets.length !== 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {markets.map((market) => (
              <Link href={`/markets/${market.address}`} key={market.address}>
                <MarketCard {...market} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
