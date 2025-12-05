import { Button } from "jstz-ui/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "jstz-ui/ui/card";
import { Separator } from "jstz-ui/ui/separator";
import { cn } from "jstz-ui/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BettingPanel } from "~/components/betting-panel";
import { mockMarkets } from "~/mock/mock-markets";

export default async function MarketPage({ params }: PageProps<"/markets/[id]">) {
  const { id } = await params;
  const market = mockMarkets.find((m) => m.id === id);

  if (!market) {
    return notFound();
  }

  return (
    <main className="flex-1">
      <div className="p-8">
        {/* Back Button */}
        <Link href="/markets">
          <Button variant="link">
            <ArrowLeft className="size-4" />
            Back to Markets
          </Button>
        </Link>

        {/* Market Details */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* Market Info Card */}
            <Card>
              <CardHeader>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                    <span className="text-sm font-bold text-primary-foreground">XTZ</span>
                  </div>

                  <div>
                    <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                      {market.category}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-card-foreground">
                      {market.yesPrice}%
                    </div>
                    <div className="text-xs text-muted-foreground">Current odds</div>
                  </div>
                </div>

                <CardTitle>{market.title}</CardTitle>
              </CardHeader>

              {/* Probability Bar */}
              <CardContent>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">YES {market.yesPrice}%</span>
                  <span className="font-medium text-muted-foreground">NO {market.noPrice}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-success to-destructive transition-all"
                    style={{ width: `${market.yesPrice}%` }}
                  />
                </div>
              </CardContent>

              <Separator />

              <CardFooter className="w-full justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Total Volume</div>

                  <div className="mt-1 font-semibold text-card-foreground">
                    {market.totalVolume}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">End Date</div>

                  <div className="mt-1 font-semibold text-card-foreground">{market.endDate}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Status</div>

                  <div className="mt-1 font-semibold text-card-foreground">
                    {market.status === "active" ? "Active" : "Resolved"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">24h Change</div>

                  <div
                    className={cn(
                      "mt-1 font-semibold",
                      market.priceChange >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {market.priceChange > 0 ? "+" : ""}
                    {market.priceChange}%
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>

          <div>
            <BettingPanel {...market} />
          </div>
        </div>
      </div>
    </main>
  );
}
