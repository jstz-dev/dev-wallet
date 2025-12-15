import { Skeleton } from "jstz-ui/ui/skeleton";

export default function MarketsPageLoading() {
  const skeletonCards = Array.from(Array(8).keys());

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
          {skeletonCards.map((idx) => (
            <Skeleton key={idx} className="rounded-xl h-59.5 w-181" />
          ))}
        </div>
      </div>
    </main>
  );
}
