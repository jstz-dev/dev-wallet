"use client";

import { Badge } from "jstz-ui/ui/badge";
import { Button } from "jstz-ui/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "jstz-ui/ui/card";
import { Separator } from "jstz-ui/ui/separator";
import { Slider } from "jstz-ui/ui/slider";
import { cn } from "jstz-ui/utils";
import { AlertTriangle, Clock, DollarSign } from "lucide-react";
import assert from "node:assert";
import { useState } from "react";
import * as CurrencyConverter from "~/lib/currencyConverter";
import type { Market } from "~/lib/validators/market";
import { Token } from "~/lib/validators/token";

const MIN_BET = 10;
const MAX_BET = 100;

interface BettingPanelProps extends Market {
  address: string;
}

export function BettingPanel({
  address,
  question,
  state,
  tokens,
  resolutionDate,
}: BettingPanelProps) {
  const [selectedSide, setSelectedSide] = useState<Token["token"]>("yes");
  const [betAmount, setBetAmount] = useState(99);

  const noToken = tokens.find((token) => token.token === "no");
  assert(noToken, "Token should be defined.");

  const yesToken = tokens.find((token) => token.token === "yes");
  assert(yesToken, "Token should be defined.");

  const volume = tokens.reduce((acc, token) => {
    if (token.isSynthetic) return acc;
    return acc + token.amount * token.price;
  }, 0);

  function calculatePotentialWin() {
    const odds = selectedSide === "yes" ? 100 / yesToken.price : 100 / noToken.price;
    return (betAmount * odds).toFixed(2);
  }

  function calculateProfit() {
    const win = Number.parseFloat(calculatePotentialWin());
    return (win - betAmount).toFixed(2);
  }

  function calculateReturn() {
    const profit = Number.parseFloat(calculateProfit());
    return ((profit / betAmount) * 100).toFixed(1);
  }

  const StateBadge = (() => {
    switch (state) {
      case "on-going":
        return <Badge className="text-xs">Active</Badge>;

      case "created":
        return (
          <Badge variant="destructive" className=" text-xs">
            Inactive
          </Badge>
        );

      case "resolved":
        return (
          <Badge variant="destructive" className="text-xs">
            Resolved
          </Badge>
        );
    }
  })();

  if (state === "resolved") {
    return (
      <Card>
        <CardHeader>
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <span className="text-sm font-bold text-primary-foreground">M</span>
              </div>

              <Badge variant="secondary">Market {address}</Badge>
            </div>

            {StateBadge}
          </div>

          <CardTitle>{question}</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-2 text-yellow-500">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Market Resolution Required</span>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Select the winning side to resolve this market
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="border-success/50 text-success hover:bg-success/20 bg-transparent"
            >
              Choose Yes as winner
            </Button>

            <Button
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/20 bg-transparent"
            >
              Choose No as winner
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <span className="text-sm font-bold text-primary-foreground">M</span>
            </div>

            <Badge variant="secondary">Market {address}</Badge>
          </div>

          {StateBadge}
        </div>

        <CardTitle>{question}</CardTitle>
      </CardHeader>

      <CardContent>
        {/* Betting Side Selection */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            Betting on:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedSide("yes")}
              className={cn(
                "rounded-lg border-2 py-3 text-sm font-semibold transition-all",
                selectedSide === "yes"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-success/10 text-success hover:border-success/50",
              )}
            >
              YES
            </button>
            <button
              onClick={() => setSelectedSide("no")}
              className={cn(
                "rounded-lg border-2 py-3 text-sm font-semibold transition-all",
                selectedSide === "no"
                  ? "border-destructive bg-destructive text-destructive-foreground"
                  : "border-border bg-destructive/10 text-destructive hover:border-destructive/50",
              )}
            >
              NO
            </button>
          </div>
        </div>

        {/* Bet Amount Slider */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">Bet Amount:</label>
            <span className="text-lg font-bold text-primary">{betAmount} XTZ</span>
          </div>

          <Slider
            value={[betAmount]}
            onValueChange={(value) => setBetAmount(value[0])}
            min={MIN_BET}
            max={MAX_BET}
            step={1}
            className="mb-2"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{MIN_BET} XTZ</span>
            <span>{MAX_BET} XTZ</span>
          </div>
        </div>

        {/* Potential Returns */}
        <div className="mb-6 space-y-2 rounded-lg bg-secondary p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Potential Win:</span>
            <span className="font-semibold text-success">{calculatePotentialWin()} XTZ</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Profit:</span>
            <span className="font-semibold text-success">{calculateProfit()} XTZ</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Return:</span>
            <span className="font-semibold text-primary">+{calculateReturn()}%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button className="flex-1 bg-secondary text-success-foreground hover:bg-secondary/90">
            Place Bet
          </Button>
        </div>
      </CardContent>

      <Separator />

      {/* Footer Info */}
      <CardFooter className="justify-between w-full">
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          <span>{CurrencyConverter.toTez(volume)} XTZ</span>
        </div>

        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{resolutionDate.split("T")[0]}</span>
        </div>

        {StateBadge}
      </CardFooter>
    </Card>
  );
}
