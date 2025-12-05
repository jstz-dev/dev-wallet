import Link from "next/link";
import { createLoader, parseAsString } from "nuqs/server";
import { MarketCard } from "~/components/market-card";
import { mockMarkets } from "~/mock/mock-markets";

const loadSearchParams = createLoader({
  category: parseAsString,
});

export default async function MarketsPage({ searchParams }: PageProps<"/markets">) {
  const { category } = await loadSearchParams(searchParams);

  const filteredMarkets = category
    ? mockMarkets.filter((market) => market.category.toLowerCase() === category.toLowerCase())
    : mockMarkets;

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
          {filteredMarkets.map((market) => (
            <Link href={`/markets/${market.id}`} key={market.id}>
              <MarketCard key={market.id} market={market} />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
