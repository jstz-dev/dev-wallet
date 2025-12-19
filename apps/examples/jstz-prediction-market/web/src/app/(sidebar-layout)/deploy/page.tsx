"use client";

import Jstz from "@jstz-dev/jstz-client";
import { useMutation } from "@tanstack/react-query";
import { useIsClient } from "@uidotdev/usehooks";
import { Alert, AlertDescription, AlertTitle } from "jstz-ui/ui/alert";
import { Button } from "jstz-ui/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "jstz-ui/ui/card";
import { Input } from "jstz-ui/ui/input";
import { Spinner } from "jstz-ui/ui/spinner";
import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, Suspense, use, useEffect, useEffectEvent, useState } from "react";
import { z } from "zod/mini";
import { useAppForm } from "~/components/ui/form";
import { env } from "~/env";
import { textDecode, textEncode } from "~/lib/encoder";
import { useJstzSignerExtension } from "~/lib/hooks/useJstzSigner";
import { MarketForm, marketFormSchema } from "~/lib/validators/market";
import { Token } from "~/lib/validators/token";
import { useJstzClient } from "~/providers/jstz-client.context";

export const responseSchema = z.union([
  z.object({
    address: z.string(),
  }),
  z.object({
    message: z.string(),
  }),
]);

export default function DeployPage() {
  const { signWithJstzExtension } = useJstzSignerExtension();
  const { getJstzClient } = useJstzClient();
  const router = useRouter();

  const { mutateAsync: deployMarket } = useMutation({
    mutationFn: async (market: MarketForm) => {
      const payload = {
        content: {
          _type: "RunFunction",
          uri: `jstz://${env.NEXT_PUBLIC_PARENT_SF_ADDRESS}/market`,
          headers: {},
          method: "POST",
          body: textEncode(market),
          gasLimit: 55_000,
        } satisfies Jstz.Operation.RunFunction,
      };

      const { operation, signature, verifier } = await signWithJstzExtension(payload);
      const jstzClient = getJstzClient();

      const {
        result: { inner },
      } = (await jstzClient.operations.injectAndPoll(
        {
          inner: operation,
          signature,
          verifier: verifier ?? null,
        },
        {
          timeout: 100 * 1_000,
        },
        // HACK: This is a workaround for the current version of `jstz-client`.
        // There's an open PR that adds proper inference for the return type of `injectAndPoll`
        // so it returns concrete Receipt based on provided `content._type` instead of a union
        // of all possible Receipts
      )) as { result: { inner: Jstz.Receipt.Success.RunFunction } };

      try {
        const { data: response, error } = responseSchema.safeParse(textDecode(inner.body));

        if (error) {
          console.error("Invalid response was given.");
          return;
        } else if ("message" in response) {
          console.info(`Completed call. Response: ${response.message}`);
          return;
        }

        router.push(`/markets/${response.address}`);
        return;
      } catch (e) {
        console.info(`Completed call. Couldn't parse it to JSON.`);

        if (typeof inner !== "string") {
          console.dir(textDecode(inner.body));
        }
      }
    },
  });

  const form = useAppForm({
    defaultValues: {
      admins: [] as string[],
      resolutionDate: new Date().toISOString(),
      question: "",
      pool: 0,
      tokens: [
        {
          token: "yes" as Token["token"],
          amount: 500,
          price: 500_000,
        },
        {
          token: "no" as Token["token"],
          amount: 500,
          price: 500_000,
        },
      ],
    },

    validators: {
      onSubmit: marketFormSchema,
    },

    onSubmit: async ({ value }) => {
      await deployMarket(value);
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    void form.handleSubmit();
  }

  return (
    <main className="flex-1">
      <div className="p-8">
        <Card className="max-w-240 mx-auto">
          <CardHeader>
            <CardTitle>Deploy Page</CardTitle>
          </CardHeader>
          <form.AppForm>
            <form onSubmit={onSubmit}>
              <CardContent className="gap-4 flex-col flex">
                <form.AppField name="question">
                  {(field) => (
                    <field.FormItem>
                      <field.FormLabel htmlFor="question">Question</field.FormLabel>

                      <field.FormControl>
                        <Input
                          type="text"
                          name="question"
                          placeholder="Will Jstz be released to the mainnet by the end of Q2 2026?"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                        />
                      </field.FormControl>

                      <field.FormMessage />
                    </field.FormItem>
                  )}
                </form.AppField>

                <form.AppField name="resolutionDate">
                  {(field) => (
                    <field.FormItem>
                      <field.FormLabel htmlFor="resolutionDate">Resolution Date</field.FormLabel>

                      <field.FormControl>
                        <Input
                          type="datetime-local"
                          name="resolutionDate"
                          value={field.state.value.split(".")[0]}
                          onChange={(e) => {
                            if (e.target.valueAsDate) {
                              field.handleChange(e.target.valueAsDate.toISOString());
                            }
                          }}
                          onBlur={field.handleBlur}
                        />
                      </field.FormControl>
                    </field.FormItem>
                  )}
                </form.AppField>
              </CardContent>

              <CardFooter className="flex-col items-start gap-4 mt-4">
                <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                  {([canSubmit, isSubmitting]) => (
                    <Suspense
                      fallback={
                        <Button type="submit" disabled iconPosition="right">
                          Deploy
                        </Button>
                      }
                    >
                      <DeployButton isSubmitting={isSubmitting} canSubmit={canSubmit} />
                    </Suspense>
                  )}
                </form.Subscribe>
              </CardFooter>
            </form>
          </form.AppForm>
        </Card>
      </div>
    </main>
  );
}

function DeployButton({ canSubmit, isSubmitting }: { canSubmit: boolean; isSubmitting: boolean }) {
  const isClient = useIsClient();

  const { checkExtensionAvailability } = useJstzSignerExtension();
  const [availabilityPromise, setAvailabilityPromise] = useState<Promise<boolean>>(
    Promise.resolve(false),
  );

  const onRender = useEffectEvent(() => {
    setAvailabilityPromise(checkExtensionAvailability());
  });

  useEffect(() => {
    onRender();
  }, []);

  const isSignerAvailable = use(availabilityPromise);

  return (
    <>
      <Button
        type="submit"
        disabled={!isSignerAvailable || !canSubmit || isSubmitting}
        className="max-w-min"
        iconPosition="right"
        renderIcon={(props) => isSubmitting && <Spinner {...props} />}
      >
        Deploy
      </Button>

      {isClient && !isSignerAvailable && (
        <Alert variant="warning">
          <TriangleAlert />

          <AlertTitle>Extension is unavailable.</AlertTitle>

          <AlertDescription>
            To use this form you need to sign the operation with a dev-wallet.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
