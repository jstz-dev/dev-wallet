import { Button } from "jstz-ui/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "jstz-ui/ui/card";
import { Progress } from "jstz-ui/ui/progress";
import { Separator } from "jstz-ui/ui/separator";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BettingPanel } from "~/components/betting-panel";
import { createJstzClient } from "~/lib/jstz-signer.service";
import { marketSchema } from "~/lib/validators/market";
import { mockMarkets } from "~/mock/mock-markets";

export default async function MarketPage({ params }: PageProps<"/markets/[address]">) {
  const { address } = await params;

  const jstz = createJstzClient();

  const [kv, balance] = await Promise.all([
    jstz.accounts.getKv(address, {
      key: "root",
    }),
    jstz.accounts.getBalance(address),
  ]);

  const { data: market, error } = marketSchema.safeParse(JSON.parse(kv));

  if (error) {
    console.error(error);
    return redirect("/404");
  }

  const [yesCount, noCount] = market.bets.reduce(
    (acc, bet) => {
      if (bet.isSynthetic) return acc;

      switch (bet.token) {
        case "yes":
          acc[0] += 1;
          break;
        case "no":
          acc[1] += 1;
          break;
      }

      return acc;
    },
    [0, 0],
  );

  const yesRatio = yesCount / market.bets.length;
  const noRatio = noCount / market.bets.length;

  const marketOld = mockMarkets.find((m) => m.id === "1");

  if (!marketOld) {
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
                      {marketOld.category}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-card-foreground">
                      {Number.isNaN(yesRatio) ? "No bets yet." : `${yesRatio}%`}
                    </div>
                    <div className="text-xs text-muted-foreground">Current odds</div>
                  </div>
                </div>

                <CardTitle>{market.question}</CardTitle>
              </CardHeader>

              {/* Probability Bar */}
              <CardContent>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">
                    YES - {yesRatio}
                    {!Number.isNaN(yesRatio) && "%"}
                  </span>
                  <span className="font-medium text-muted-foreground">
                    NO - {noRatio}
                    {!Number.isNaN(noRatio) && "%"}
                  </span>
                </div>

                <Progress
                  value={Number.isNaN(yesRatio) ? 50 : yesRatio}
                  indicatorProps={{
                    className: Number.isNaN(yesRatio)
                      ? "bg-destructive/20"
                      : "bg-destructive rounded-r-md",
                  }}
                />
              </CardContent>

              <Separator />

              <CardFooter className="w-full justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Total Volume</div>

                  <div className="mt-1 font-semibold text-card-foreground">{balance}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">End Date</div>

                  <div className="mt-1 font-semibold text-card-foreground">
                    {market.resolutionDate.split("T")[0]}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Status</div>

                  <div className="mt-1 font-semibold text-card-foreground">
                    {market.state === "on-going" ? "Active" : "Resolved"}
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>

          <div>
            <BettingPanel address={address} {...market} />
          </div>
        </div>
      </div>
    </main>
  );
}
