import { Skeleton } from "jstz-ui/ui/skeleton";

export default function MarketsPageLoading() {
  const skeletonCards = Array.from(Array(9).keys());

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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 grid-rows-[auto]">
          {skeletonCards.map((idx) => (
            <Skeleton key={idx} className="rounded-xl self-stretch justify-self-stretch h-64.5" />
          ))}
        </div>
      </div>
    </main>
  );
}
