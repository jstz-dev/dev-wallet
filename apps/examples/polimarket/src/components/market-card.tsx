"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Badge } from "jstz-ui/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "jstz-ui/ui/card";
import { Progress } from "jstz-ui/ui/progress";
import { Separator } from "jstz-ui/ui/separator";
import { Clock } from "lucide-react";
import assert from "node:assert";
import * as CurrencyConverter from "~/lib/currencyConverter";
import { Market } from "~/lib/validators/market";
import { accounts } from "~/queries/account.queries";

interface MarketCardProps extends Market {
  address: string;
}

export function MarketCard({
  state,
  question,
  tokens,
  resolutionDate,
  bets,
  address,
}: MarketCardProps) {
  const isResolved = state === "resolved";

  const noToken = tokens.find((token) => token.token === "no");
  assert(noToken, "Token should be defined.");

  const yesToken = tokens.find((token) => token.token === "yes");
  assert(yesToken, "Token should be defined.");

  const { data: balance } = useSuspenseQuery(accounts.balance(address));

  const [yesCount, noCount] = bets.reduce(
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

  const numberOfTokens = tokens.reduce((acc, token) => acc + token.amount, 0);

  const yesRatio = (yesCount / numberOfTokens) * 100;
  const noRatio = (noCount / numberOfTokens) * 100;

  return (
    <Card className="group cursor-pointer overflow-hidden border-border bg-card transition-all hover:border-primary/50">
      {/* Header */}
      <CardHeader>
        <div className="flex items-center gap-2 justify-between">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <span className="text-xs font-bold text-primary-foreground">XTZ</span>
          </div>

          {bets.length === 0 && <Badge>No bets yet.</Badge>}
        </div>

        {/* Title */}
        <CardTitle>{question}</CardTitle>
      </CardHeader>

      {/* Probability Display */}
      <CardContent>
        {!isResolved && (
          <>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium text-muted-foreground">
                YES - {yesRatio.toFixed(2)}
                {!Number.isNaN(yesRatio) && "%"}
              </span>

              <span className="font-medium text-muted-foreground">
                NO - {noRatio.toFixed(2)}
                {!Number.isNaN(noRatio) && "%"}
              </span>
            </div>

            {/* Probability Bar */}
            <Progress
              value={Number.isNaN(yesRatio) ? 50 : yesRatio}
              indicatorProps={{
                className: Number.isNaN(yesRatio)
                  ? "bg-destructive/20"
                  : "bg-destructive rounded-r-md",
              }}
            />
          </>
        )}

        {/* Resolved State */}
        {isResolved && (
          <div className="rounded-lg bg-success/20 border border-success/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-success">
                  <span className="text-sm font-semibold">Market Resolved</span>
                </div>

                <p className="mt-1 text-sm text-success/80">
                  Winning side: {market.winningOutcome?.toUpperCase()}
                </p>
              </div>
            </div>

            {/* {market.userPosition && ( */}
            {/*   <button className="mt-3 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"> */}
            {/*     Claim winnings */}
            {/*   </button> */}
            {/* )} */}
          </div>
        )}
      </CardContent>

      <Separator />

      {/* Footer */}
      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          <span>{CurrencyConverter.toTez(balance)}</span>
        </div>

        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{resolutionDate.split("T")[0]}</span>
        </div>

        {isResolved && (
          <Badge variant="destructive" className="text-xs">
            Resolved
          </Badge>
        )}

        {/* {!isResolved && market.userPosition && ( */}
        {/*   <Badge variant="default" className="bg-primary text-xs"> */}
        {/*     Active */}
        {/*   </Badge> */}
        {/* )} */}
      </CardFooter>
    </Card>
  );
}

function DollarSign({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
