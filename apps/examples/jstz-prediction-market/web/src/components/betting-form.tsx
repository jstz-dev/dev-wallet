import { APIError } from "@jstz-dev/jstz-client";
import { type UseMutateAsyncFunction, useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "jstz-ui/ui/button";
import { CardContent, CardFooter } from "jstz-ui/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "jstz-ui/ui/dialog";
import { Separator } from "jstz-ui/ui/separator";
import { Slider } from "jstz-ui/ui/slider";
import { Spinner } from "jstz-ui/ui/spinner";
import { cn } from "jstz-ui/utils";
import { CheckCircle, Clock, ServerCrash } from "lucide-react";
import assert from "node:assert";
import { type FormEvent, useState } from "react";
import { ZodError } from "zod";
import { z } from "zod/mini";
import * as CurrencyConverter from "~/lib/currencyConverter";
import { HTTPCode } from "~/lib/HTTPCode";
import { Market } from "~/lib/validators/market";
import { Token, tokenSchema } from "~/lib/validators/token";
import { accounts } from "~/queries/account.queries";
import { TezSign } from "./TezSign";
import { useAppForm } from "./ui/form";

const betFormSchema = z.pick(tokenSchema, { token: true, amount: true });

type BettingFormProps = Market & {
  onSubmit: UseMutateAsyncFunction<void, Error, Pick<Token, "token"> & { amount: number }>;
  address: string;
};

export function BettingForm({ onSubmit, tokens, bets, address, resolutionDate }: BettingFormProps) {
  const noToken = tokens.find((token) => token.token === "no");
  assert(noToken, "Token should be defined.");

  const yesToken = tokens.find((token) => token.token === "yes");
  assert(yesToken, "Token should be defined.");

  const { data: balance } = useSuspenseQuery(accounts.balance(address));

  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const form = useAppForm({
    defaultValues: {
      token: "yes" as Token["token"],
      amount: yesToken.price,
    },

    validators: {
      onSubmit: betFormSchema,
    },

    onSubmit: async ({ value }) => {
      await onSubmit(value, {
        onSuccess: () => {
          setSuccessModalOpen(true);
        },

        onError: (err) => {
          switch (true) {
            case err instanceof ZodError:
              console.error("Invalid response was given.");
              setErrorMessage(
                "We received a response from the server that we have not expected. This is an error on our part.",
              );
              break;

            case err instanceof SyntaxError:
              console.error(`Completed call. Couldn't parse it to JSON.`);
              setErrorMessage(
                "We received a response that we couldn't properly deserialise. This is an error on our part.",
              );
              break;

            case err instanceof APIError:
              if (
                err.status >= HTTPCode.BAD_REQUEST &&
                err.status < HTTPCode.INTERNAL_SERVER_ERROR
              ) {
                if (err.message.includes("InsufficientFunds")) {
                  setErrorMessage("You don't have enough funds.");
                } else setErrorMessage(`You did something wrong: ${err.message}`);
              } else {
                setErrorMessage(`There was an issue whith the server: ${err.message}`);
              }
              break;

            case err instanceof Error:
              console.error(err);
              setErrorMessage(
                "We received an error response from the server. Something have not went quite right. Try again later.",
              );
              break;
          }

          setErrorDialogOpen(true);
        },
      });
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
            <TezSign className="text-base" />
            <span>{CurrencyConverter.toTez(balance)}</span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            <span>{resolutionDate.split("T")[0]}</span>
          </div>
        </CardFooter>
      </form>

      {/* Success Dialog */}
      <Dialog
        open={successModalOpen}
        onOpenChange={(open) => {
          setSuccessModalOpen(open);

          if (!open) {
            form.reset();
          }
        }}
      >
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>

            <DialogTitle className="text-2xl text-card-foreground">
              Bet Placed Successfully!
            </DialogTitle>

            <DialogDescription className="text-muted-foreground">
              Your bet has been submitted to chain.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline" className="w-full bg-transparent">
                Place Another Bet
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        open={errorDialogOpen}
        onOpenChange={(open) => {
          setErrorDialogOpen(open);

          if (!open) {
            form.reset();
          }
        }}
      >
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-secondary">
              <ServerCrash className="size-10 text-muted-foreground" />
            </div>

            <DialogTitle className="text-2xl text-card-foreground">
              Something went wrong.
            </DialogTitle>

            <DialogDescription className="text-muted-foreground">
              We couldn&apos;t process the bet.
            </DialogDescription>
          </DialogHeader>

          <div>{errorMessage}</div>

          <div className="flex flex-col gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline" className="w-full bg-transparent">
                Dismiss
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </form.AppForm>
  );
}
