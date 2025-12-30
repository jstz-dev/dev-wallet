"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { isPast } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "jstz-ui/ui/alert";
import { Badge } from "jstz-ui/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "jstz-ui/ui/card";
import { Progress } from "jstz-ui/ui/progress";
import { Separator } from "jstz-ui/ui/separator";
import { Clock } from "lucide-react";
import { notFound } from "next/navigation";
import assert from "node:assert";
import * as CurrencyConverter from "~/lib/currencyConverter";
import { marketSchema } from "~/lib/validators/market";
import { useJstzClient } from "~/providers/jstz-client.context";
import { accounts } from "~/queries/account.queries";
import { smartFunctions } from "~/queries/smartFunctions.queries";
import { StateBadge } from "./market-state-badge";

interface MarketCardProps {
  address: string;
}

export function MarketCard({ address }: MarketCardProps) {
  const { getJstzClient } = useJstzClient();
  const jstzClient = getJstzClient();

  const { data: market } = useSuspenseQuery({
    ...smartFunctions.getKv(address, "root", jstzClient),
    select: (data) => {
      // FIXME: get rid of type assertion
      const { data: market, error } = marketSchema.safeParse(JSON.parse(data as string));

      if (error) {
        console.error(error);
        return notFound();
      }

      const isWaitingForResolution =
        market.state !== "resolved" && market.state !== "closed" && isPast(market.resolutionDate);

      if (isWaitingForResolution) {
        market.state = "waiting-for-resolution";
      }

      return market;
    },
  });

  const { tokens, bets, question, state } = market;

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
    <Card className="group cursor-pointer overflow-hidden border-border bg-card transition-all hover:border-primary/50 h-full">
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
      <CardContent className="flex-1">
        {state === "on-going" && (
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

        {/* Waiting for Resolution State */}
        {state === "waiting-for-resolution" && (
          <Alert variant="warning">
            <AlertTitle>Market Waiting to be Resolved</AlertTitle>

            <AlertDescription>Market needs to be resolved by and admin.</AlertDescription>
          </Alert>
        )}

        {/* Resolved State */}
        {state === "resolved" && (
          <Alert>
            <AlertTitle>Market Resolved</AlertTitle>

            <AlertDescription>
              <p>Winning side: {market.resolvedToken.token.toUpperCase()}</p>
              <p>Admin needs to initialize pay out.</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Closed State */}
        {state === "closed" && (
          <Alert variant="destructive">
            <AlertTitle>Market Resolved</AlertTitle>

            <AlertDescription>
              Winning side: {market.resolvedToken.token.toUpperCase()}
            </AlertDescription>
          </Alert>
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
          <span>{market.resolutionDate.split("T")[0]}</span>
        </div>

        <StateBadge state={state} />

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
