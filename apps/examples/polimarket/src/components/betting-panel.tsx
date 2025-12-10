"use client";
import { Badge } from "jstz-ui/ui/badge";
import { Button } from "jstz-ui/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "jstz-ui/ui/card";
import { Separator } from "jstz-ui/ui/separator";
import { Slider } from "jstz-ui/ui/slider";
import { Spinner } from "jstz-ui/ui/spinner";
import { cn } from "jstz-ui/utils";
import { AlertTriangle, Clock, DollarSign } from "lucide-react";
import { FormEvent } from "react";
import { z } from "zod/mini";
import { tokenSchema } from "~/lib/validators/token";
import type { Market } from "./market-card";
import { useAppForm } from "./ui/form";

const MIN_BET = 10;
const MAX_BET = 100;

const betFormSchema = z.pick(tokenSchema, { token: true, amount: true });

type BettingPanelProps = Pick<
  Market,
  "id" | "title" | "yesPrice" | "noPrice" | "status" | "userPosition"
>;

export function BettingPanel({
  id,
  title,
  yesPrice,
  noPrice,
  status,
  userPosition,
}: BettingPanelProps) {
  const form = useAppForm({
    defaultValues: {
      token: "yes" as "yes" | "no",
      amount: MIN_BET,
    },

    validators: {
      onSubmit: betFormSchema,
    },

    onSubmit: ({ value }) => {
      console.log(value);
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.stopPropagation();
    e.preventDefault();
    void form.handleSubmit();
  }

  function calculatePotentialWin(side: "yes" | "no", betAmount: number) {
    const odds = side === "yes" ? 100 / yesPrice : 100 / noPrice;
    return (betAmount * odds).toFixed(2);
  }

  function calculateProfit(side: "yes" | "no", betAmount: number) {
    const win = Number.parseFloat(calculatePotentialWin(side, betAmount));
    return (win - betAmount).toFixed(2);
  }

  function calculateReturn(side: "yes" | "no", betAmount: number) {
    const profit = Number.parseFloat(calculateProfit(side, betAmount));
    return ((profit / betAmount) * 100).toFixed(1);
  }

  if (status === "resolved") {
    return (
      <Card className="border-border bg-card p-6">
        <CardHeader>
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <span className="text-sm font-bold text-primary-foreground">M</span>
              </div>

              <Badge variant="secondary">Market #{id}</Badge>
            </div>

            <Badge variant="destructive">Resolved</Badge>
          </div>

          <CardTitle>{title}</CardTitle>
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
              className="border-primary/50 text-primary hover:bg-primary/20 bg-transparent"
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
    <Card className="border-border bg-card p-6">
      <CardHeader>
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <span className="text-sm font-bold text-primary-foreground">M</span>
            </div>

            <Badge variant="secondary">Market #{id}</Badge>
          </div>

          {userPosition && <Badge className="bg-primary">Active</Badge>}
        </div>

        <CardTitle>{title}</CardTitle>
      </CardHeader>

      {/* Betting Side Selection */}
      <CardContent>
        <form.AppForm>
          <form onSubmit={onSubmit}>
            <form.AppField name="token">
              {(field) => (
                <field.FormItem className="mb-6">
                  <field.FormLabel className="mb-2 block text-sm font-medium text-muted-foreground">
                    Betting on:
                  </field.FormLabel>

                  <field.FormControl>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => field.handleChange("yes")}
                        className={cn(
                          "rounded-lg border-2",
                          field.state.value === "yes"
                            ? "border-primary bg-primary text-primary-foreground hover:bg-primary pointer-events-none"
                            : "border-border bg-primary/10 text-primary hover:border-primary/50 hover:bg-secondary",
                        )}
                      >
                        YES
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={() => field.handleChange("no")}
                        className={cn(
                          "rounded-lg border-2",
                          field.state.value === "no"
                            ? "border-destructive bg-destructive text-destructive-foreground pointer-events-none"
                            : "border-border dark:bg-destructive/20 text-destructive hover:border-destructive/50",
                        )}
                      >
                        NO
                      </Button>
                    </div>
                  </field.FormControl>
                </field.FormItem>
              )}
            </form.AppField>
          </form>
        </form.AppForm>

        {/* Bet Amount Slider */}
        <form.AppField name="amount">
          {(field) => (
            <field.FormItem className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <field.FormLabel
                  htmlFor="bet-amount"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Bet Amount:
                </field.FormLabel>

                <span className="text-lg font-bold text-primary">{field.state.value} XTZ</span>
              </div>

              <field.FormControl>
                <Slider
                  name="bet-amount"
                  value={[field.state.value]}
                  onValueChange={(value) => field.handleChange(value[0])}
                  min={MIN_BET}
                  max={MAX_BET}
                  step={1}
                  className="mb-2"
                />
              </field.FormControl>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_BET} XTZ</span>
                <span>{MAX_BET} XTZ</span>
              </div>
            </field.FormItem>
          )}
        </form.AppField>

        {/* Potential Returns */}
        <form.Subscribe selector={({ values }) => [values.token, values.amount] as const}>
          {([token, amount]) => (
            <div className="mb-6 space-y-2 rounded-lg bg-secondary p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Potential Win:</span>
                <span className="font-semibold text-success">
                  {calculatePotentialWin(token, amount)} XTZ
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Profit:</span>
                <span className="font-semibold text-success">
                  {calculateProfit(token, amount)} XTZ
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Return:</span>
                <span className="font-semibold text-primary">
                  +{calculateReturn(token, amount)}%
                </span>
              </div>
            </div>
          )}
        </form.Subscribe>

        {/* Action Buttons */}
        <div className="flex">
          <form.Subscribe selector={({ canSubmit, isSubmitting }) => [canSubmit, isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button
                className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                disabled={!canSubmit || isSubmitting}
                iconPosition="right"
                renderIcon={(props) => isSubmitting && <Spinner {...props} />}
              >
                Place Bet
              </Button>
            )}
          </form.Subscribe>
        </div>
      </CardContent>

      <Separator />

      {/* Footer Info */}
      <CardFooter className="justify-between w-full">
        <div className="flex items-center gap-1">
          <DollarSign className="size-4" />
          <span>0 XTZ</span>
        </div>

        <div className="flex items-center gap-1">
          <Clock className="size-4" />
          <span>19/09/2025</span>
        </div>

        <Badge className="bg-primary text-xs">Active</Badge>
      </CardFooter>
    </Card>
  );
}
