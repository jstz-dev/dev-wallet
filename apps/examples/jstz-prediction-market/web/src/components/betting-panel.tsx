"use client";

import Jstz from "@jstz-dev/jstz-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "jstz-ui/ui/alert";
import { Badge } from "jstz-ui/ui/badge";
import { Button } from "jstz-ui/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "jstz-ui/ui/card";
import { Spinner } from "jstz-ui/ui/spinner";
import { AlertTriangle } from "lucide-react";
import { useJstzSignerExtension } from "~/lib/hooks/useJstzSigner";
import { SignWithJstzSignerParams } from "~/lib/jstz-signer.service";
import type { Market } from "~/lib/validators/market";
import { Token } from "~/lib/validators/token";
import { useJstzClient } from "~/providers/jstz-client.context";
import { accounts } from "~/queries/account.queries";
import { smartFunctions } from "~/queries/smartFunctions.queries";
import { textDecode, textEncode } from "~/utils/encoder";
import { BettingForm } from "./betting-form";
import { StateBadge } from "./market-state-badge";

type RunSmartFunction = (payload: SignWithJstzSignerParams) => Promise<{
  result: {
    inner: Jstz.Receipt.Success.RunFunction;
  };
}>;

function createSmartFunctionRunner(
  jstzClient: Jstz,
  signWithJstzExtension: ReturnType<typeof useJstzSignerExtension>["signWithJstzExtension"],
): RunSmartFunction {
  return async (payload: SignWithJstzSignerParams) => {
    const { operation, signature, verifier } = await signWithJstzExtension(payload);

    return (await jstzClient.operations.injectAndPoll(
      {
        inner: operation,
        signature,
        verifier: verifier ?? null,
      },
      {
        timeout: 10 * 1_000,
      },
      // HACK: This is a workaround for the current version of `jstz-client`.
      // There's an open PR that adds proper inference for the return type of `injectAndPoll`
      // so it returns concrete Receipt based on provided `content._type` instead of a union
      // of all possible Receipts
    )) as { result: { inner: Jstz.Receipt.Success.RunFunction } };
  };
}

type BettingPanelProps = {
  address: string;
} & Market;

export function BettingPanel(props: BettingPanelProps) {
  const { address, question, state } = props;

  const { signWithJstzExtension } = useJstzSignerExtension();
  const { getJstzClient } = useJstzClient();

  const jstzClient = getJstzClient();

  const runSmartFunction = createSmartFunctionRunner(jstzClient, signWithJstzExtension);

  const queryClient = useQueryClient();

  const { mutateAsync: placeBet } = useMutation({
    mutationFn: async ({ token, amount }: Pick<Token, "token"> & { amount: number }) => {
      console.log(amount);

      const payload: SignWithJstzSignerParams = {
        content: {
          _type: "RunFunction",
          uri: `jstz://${address}/bet`,
          headers: {
            // @ts-expect-error The types for headers require `number` but when you pass it signing will fail.
            // It that's why we are passing it as a `string`.
            "X-JSTZ-TRANSFER": amount.toString(),
          },
          method: "POST",
          body: textEncode({ token }),
          gasLimit: 55_000,
        },
      };

      const {
        result: { inner },
      } = await runSmartFunction(payload);

      console.log(textDecode(inner.body));
    },

    onSuccess: () => {
      void queryClient.invalidateQueries(smartFunctions.getKv(address, "root", jstzClient));
      void queryClient.invalidateQueries(accounts.balance(address, jstzClient));
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="mb-4 flex items-start justify-between min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <span className="text-sm font-bold text-primary-foreground">M</span>
            </div>

            <Badge variant="secondary">{address}</Badge>
          </div>

          <StateBadge state={state} />
        </div>

        <CardTitle>
          <h2>{question}</h2>
        </CardTitle>
      </CardHeader>

      {(() => {
        switch (state) {
          case "on-going":
            return <BettingForm onSubmit={placeBet} {...props} />;

          case "waiting-for-resolution":
            return <WaitingForResolution address={address} runSmartFunction={runSmartFunction} />;

          case "resolved":
            return (
              <Resolved
                address={address}
                runSmartFunction={runSmartFunction}
                resolvedToken={props.resolvedToken}
              />
            );

          case "closed":
            return (
              <CardContent>
                <Alert variant="destructive">
                  <AlertTitle>Market Closed</AlertTitle>

                  <AlertDescription>
                    <p>Winning side: {props.resolvedToken.token.toUpperCase()}</p>
                    <p>Money have been paid out.</p>
                  </AlertDescription>
                </Alert>
              </CardContent>
            );

          case "created":
            return null;
        }
      })()}
    </Card>
  );
}

interface WaitingForResolutionProps {
  address: string;
  runSmartFunction: RunSmartFunction;
}

function WaitingForResolution({ address, runSmartFunction }: WaitingForResolutionProps) {
  const queryClient = useQueryClient();

  const { getJstzClient } = useJstzClient();
  const jstzClient = getJstzClient();

  const { mutateAsync: resolveYes, isPending: isResolveYesPending } = useMutation({
    mutationFn: async () => {
      const payload: SignWithJstzSignerParams = {
        content: {
          _type: "RunFunction",
          uri: `jstz://${address}/resolve`,
          headers: {},
          method: "POST",
          body: textEncode({ token: "yes" }),
          gasLimit: 55_000,
        },
      };

      const {
        result: { inner },
      } = await runSmartFunction(payload);

      console.log(textDecode(inner.body));
    },

    onSuccess: () => {
      void queryClient.invalidateQueries(smartFunctions.getKv(address, "root", jstzClient));
      void queryClient.invalidateQueries(accounts.balance(address, jstzClient));
    },
  });

  const { mutateAsync: resolveNo, isPending: isResolveNoPending } = useMutation({
    mutationFn: async () => {
      const payload: SignWithJstzSignerParams = {
        content: {
          _type: "RunFunction",
          uri: `jstz://${address}/resolve`,
          headers: {},
          method: "POST",
          body: textEncode({ token: "yes" }),
          gasLimit: 55_000,
        },
      };

      const {
        result: { inner },
      } = await runSmartFunction(payload);

      console.log(textDecode(inner.body));
    },

    onSuccess: () => {
      void queryClient.invalidateQueries(smartFunctions.getKv(address, "root", jstzClient));
      void queryClient.invalidateQueries(accounts.balance(address, jstzClient));
    },
  });

  return (
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
          disabled={isResolveNoPending || isResolveYesPending}
          onClick={() => void resolveYes()}
          className="border-primary/50 text-primary hover:bg-primary/20 bg-transparent"
          iconPosition="right"
          renderIcon={(props) => isResolveYesPending && <Spinner {...props} />}
        >
          Choose &quot;Yes&quot; as winner
        </Button>

        <Button
          variant="outline"
          disabled={isResolveNoPending || isResolveYesPending}
          onClick={() => void resolveNo()}
          className="border-destructive/50 text-destructive hover:bg-destructive/20 bg-transparent"
          iconPosition="right"
          renderIcon={(props) => isResolveNoPending && <Spinner {...props} />}
        >
          Choose &quot;No&quot; as winner
        </Button>
      </div>
    </CardContent>
  );
}

interface ResolvedProps {
  address: string;
  runSmartFunction: RunSmartFunction;
  resolvedToken: Token;
}

function Resolved({ address, runSmartFunction, resolvedToken }: ResolvedProps) {
  const queryClient = useQueryClient();

  const { getJstzClient } = useJstzClient();
  const jstzClient = getJstzClient();

  const { mutateAsync: payout, isPending } = useMutation({
    mutationFn: async () => {
      const payload: SignWithJstzSignerParams = {
        content: {
          _type: "RunFunction",
          uri: `jstz://${address}/payout`,
          headers: {},
          method: "POST",
          body: null,
          gasLimit: 55_000,
        },
      };

      const {
        result: { inner },
      } = await runSmartFunction(payload);

      console.log(textDecode(inner.body));
    },

    onSuccess: () => {
      void queryClient.invalidateQueries(smartFunctions.getKv(address, "root", jstzClient));
      void queryClient.invalidateQueries(accounts.balance(address, jstzClient));
    },
  });

  return (
    <>
      <CardContent>
        <Alert>
          <AlertTitle>Market Resolved</AlertTitle>

          <AlertDescription>Winning side: {resolvedToken.token.toUpperCase()}</AlertDescription>
        </Alert>
      </CardContent>

      <CardFooter>
        <Button
          disabled={isPending}
          onClick={() => void payout()}
          className="w-full"
          iconPosition="right"
          renderIcon={(props) => isPending && <Spinner {...props} />}
        >
          Pay out
        </Button>
      </CardFooter>
    </>
  );
}
