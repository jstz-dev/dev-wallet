"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "jstz-ui/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "jstz-ui/ui/card";
import { Progress } from "jstz-ui/ui/progress";
import { Separator } from "jstz-ui/ui/separator";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect, useParams } from "next/navigation";
import { BettingPanel } from "~/components/betting-panel";
import * as CurrencyConverter from "~/lib/currencyConverter";
import { createJstzClient } from "~/lib/jstz-signer.service";
import { marketSchema } from "~/lib/validators/market";
import { accounts } from "~/queries/account.queries";
import { smartFunctions } from "~/queries/smartFunctions.queries";

type Params = Awaited<PageProps<"/markets/[address]">["params"]>;

export default function MarketPage() {
  const { address } = useParams<Params>();

  const jstzClient = createJstzClient();

  const { data: kv } = useSuspenseQuery(smartFunctions.getKv(address, "root", jstzClient));

  const { data: balance } = useSuspenseQuery(accounts.balance(address));

  // FIXME: get rid of type assertion
  const { data: market, error } = marketSchema.safeParse(JSON.parse(kv as string));

  if (error) {
    console.error(error);
    return redirect("/404");
  }

  const [yesCount, noCount] = market.bets.reduce(
    (acc, bet) => {
      switch (bet.token) {
        case "yes":
          acc[0] += bet.amount;
          break;
        case "no":
          acc[1] += bet.amount;
          break;
      }

      return acc;
    },
    [0, 0],
  );

  const numberOfTokens = market.tokens.reduce((acc, token) => acc + token.amount, 0);

  const yesRatio = (yesCount / numberOfTokens) * 100;
  const noRatio = (noCount / numberOfTokens) * 100;

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
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
          <div className="xl:col-span-2">
            {/* Market Info Card */}
            <Card>
              <CardHeader>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                    <span className="text-sm font-bold text-primary-foreground">XTZ</span>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-card-foreground">
                      {Number.isNaN(yesRatio) ? "No bets yet." : `${yesRatio.toFixed(2)}%`}
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
                    YES - {yesRatio.toFixed(2)}
                    {!Number.isNaN(yesRatio) && "%"}
                  </span>

                  <span className="font-medium text-muted-foreground">
                    NO - {noRatio.toFixed(2)}
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

                  <div className="mt-1 font-semibold text-card-foreground">
                    {CurrencyConverter.toTez(balance)}
                  </div>
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

          <BettingPanel address={address} {...market} />
        </div>
      </div>
    </main>
  );
}
