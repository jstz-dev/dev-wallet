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
    .then((value): unknown => JSON.parse(value));

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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {markets.map((market) => (
            <Link href={`/markets/${market.address}`} key={market.address}>
              <MarketCard {...market} />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
