import { useSuspenseQuery } from "@tanstack/react-query";
import { Badge } from "jstz-ui/ui/badge";
import { Button } from "jstz-ui/ui/button";
import { CardContent, CardFooter } from "jstz-ui/ui/card";
import { Separator } from "jstz-ui/ui/separator";
import { Slider } from "jstz-ui/ui/slider";
import { Spinner } from "jstz-ui/ui/spinner";
import { cn } from "jstz-ui/utils";
import { Clock, DollarSign } from "lucide-react";
import assert from "node:assert";
import { FormEvent } from "react";
import { z } from "zod/mini";
import * as CurrencyConverter from "~/lib/currencyConverter";
import { Market } from "~/lib/validators/market";
import { Token, tokenSchema } from "~/lib/validators/token";
import { accounts } from "~/queries/account.queries";
import { useAppForm } from "./ui/form";

const betFormSchema = z.pick(tokenSchema, { token: true, amount: true });

type BettingFormProps = Market & {
  onSubmit: (value: Pick<Token, "token" | "amount">) => Promise<void>;
  address: string;
};

export function BettingForm({
  onSubmit,
  tokens,
  bets,
  address,
  state,
  resolutionDate,
}: BettingFormProps) {
  const noToken = tokens.find((token) => token.token === "no");
  assert(noToken, "Token should be defined.");

  const yesToken = tokens.find((token) => token.token === "yes");
  assert(yesToken, "Token should be defined.");

  const { data: balance } = useSuspenseQuery(accounts.balance(address));

  const form = useAppForm({
    defaultValues: {
      token: "yes" as Token["token"],
      amount: yesToken.price,
    },

    validators: {
      onSubmit: betFormSchema,
    },

    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  function calculatePotentialWin(side: "yes" | "no", betAmount: number) {
    const token = side === "yes" ? yesToken : noToken;
    assert(
      token,
      "If `token` is `undefined` at this point something is wrong with the logic of assigning the initial tokens.",
    );

    const syntheticBetsAmount = bets.reduce((acc, bet) => {
      if (bet.isSynthetic && side === bet.token) {
        return acc + bet.amount;
      }

      return acc;
    }, 0);

    const tokensToBuy = betAmount / token.price;

    const result = (balance + betAmount) / (token.amount - syntheticBetsAmount + tokensToBuy);

    return result * tokensToBuy;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.stopPropagation();
    e.preventDefault();
    void form.handleSubmit();
  }

  function calculateProfit(side: "yes" | "no", betAmount: number) {
    const win = calculatePotentialWin(side, betAmount);
    return Math.max(win - betAmount, 0);
  }

  function calculateReturn(side: "yes" | "no", betAmount: number) {
    const profit = calculateProfit(side, betAmount);
    return (profit / betAmount) * 100;
  }

  const StateBadge = (() => {
    switch (state) {
      case "on-going":
        return <Badge className="text-xs">Active</Badge>;

      case "waiting-for-resolution":
        return (
          <Badge variant="warning" className="text-xs">
            Waiting for Resolution
          </Badge>
        );

      case "resolved":
        return (
          <Badge variant="destructive" className="text-xs">
            Resolved
          </Badge>
        );

      case "created":
        return (
          <Badge variant="outline" className=" text-xs">
            Inactive
          </Badge>
        );
    }
  })();

  return (
    <form.AppForm>
      <form onSubmit={handleSubmit}>
        {/* Betting Side Selection */}
        <CardContent>
          <form.AppField name="token">
            {(field) => (
              <field.FormItem className="mb-6">
                <field.FormLabel className="mb-2 block text-sm font-medium text-muted-foreground">
                  Betting on:
                </field.FormLabel>

                <field.FormControl>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        field.handleChange("yes");
                        form.setFieldValue("amount", yesToken.price);
                      }}
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
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        field.handleChange("no");
                        form.setFieldValue("amount", noToken.price);
                      }}
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

          {/* Bet Amount Slider */}
          <form.AppField name="amount">
            {(field) => {
              const side = form.getFieldValue("token");

              const token = side === "yes" ? yesToken : noToken;
              const price = token.price;

              return (
                <field.FormItem className="mb-6">
                  <div className="mb-3 flex items-center justify-between">
                    <field.FormLabel
                      htmlFor="bet-amount"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Bet Amount:
                    </field.FormLabel>

                    <span className="text-lg font-bold text-primary">
                      {CurrencyConverter.toTez(field.state.value)} XTZ
                    </span>
                  </div>

                  <field.FormControl>
                    <Slider
                      name="bet-amount"
                      value={[field.state.value]}
                      onValueChange={(value) => field.handleChange(value[0])}
                      min={price}
                      max={price * 100}
                      step={price}
                      className="mb-2"
                    />
                  </field.FormControl>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{CurrencyConverter.toTez(price)} XTZ</span>
                    <span>{CurrencyConverter.toTez(price * 100)} XTZ</span>
                  </div>
                </field.FormItem>
              );
            }}
          </form.AppField>

          {/* Potential Returns */}
          <form.Subscribe selector={({ values }) => [values.token, values.amount] as const}>
            {([token, amount]) => (
              <div className="mb-6 space-y-2 rounded-lg bg-secondary p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Potential Win:</span>
                  <span className="font-semibold text-success">
                    {CurrencyConverter.toTez(calculatePotentialWin(token, amount))} XTZ
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Profit:</span>
                  <span className="font-semibold text-success">
                    {CurrencyConverter.toTez(calculateProfit(token, amount))} XTZ
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Return:</span>
                  <span className="font-semibold text-primary">
                    +{calculateReturn(token, amount).toFixed(2)}%
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
                  type="submit"
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

        <Separator className="my-6" />

        {/* Footer Info */}
        <CardFooter className="justify-between w-full">
          <div className="flex items-center gap-1">
            <DollarSign className="size-3" />
            <span>{CurrencyConverter.toTez(balance)} XTZ</span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            <span>{resolutionDate.split("T")[0]}</span>
          </div>
        </CardFooter>
      </form>
    </form.AppForm>
  );
}
