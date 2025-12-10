"use client";

import { useIsClient } from "@uidotdev/usehooks";
import { Alert, AlertDescription, AlertTitle } from "jstz-ui/ui/alert";
import { Button } from "jstz-ui/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "jstz-ui/ui/card";
import { Input } from "jstz-ui/ui/input";
import { Spinner } from "jstz-ui/ui/spinner";
import { TriangleAlert } from "lucide-react";
import { FormEvent, Suspense, use, useEffect, useEffectEvent, useState } from "react";
import { useAppForm } from "~/components/ui/form";
import { textDecode } from "~/lib/encoder";
import { useJstzSignerExtension } from "~/lib/hooks/useJstzSigner";
import { SignWithJstzSignerParams } from "~/lib/jstz-signer.service";
import { marketSchema } from "~/lib/validators/market";
import { useJstzClient } from "~/providers/jstz-client.context";

export default function DeployPage() {
  const { signWithJstzExtension } = useJstzSignerExtension();
  const { getJstzClient } = useJstzClient();

  const form = useAppForm({
    defaultValues: {
      admins: [] as string[],
      question: "Will Jstz be released to the mainnet by the end of Q2 2026?",
      resolutionDate: new Date().toISOString(),
      pool: 0,
      tokens: [
        {
          isSynthetic: true,
          token: "yes",
          amount: 70,
          price: 1,
        },
        {
          isSynthetic: true,
          token: "no",
          amount: 30,
          price: 1,
        },
      ],
    },

    validators: {
      onSubmit: marketSchema,
    },

    onSubmit: async ({ value }) => {
      const payload: SignWithJstzSignerParams = {
        content: {
          _type: "RunFunction",
          uri: "jstz://KT1E4RkaHm7DGa4skL383QE7bWvCDcsnYQDo/health",
          headers: {},
          method: "GET",
          body: null,
          gasLimit: 55_000,
        },
      };

      const { operation, signature, verifier } = await signWithJstzExtension(payload);
      const jstzClient = getJstzClient();

      const {
        result: { inner },
      } = await jstzClient.operations.injectAndPoll({
        inner: operation,
        signature,
        verifier: verifier ?? null,
      });

      let returnedMessage = "No message.";

      if (typeof inner === "object" && "body" in inner) {
        returnedMessage =
          (inner.body && JSON.stringify(textDecode(inner.body), null, 2)) ?? "No message.";
      }

      if (typeof inner === "string") {
        returnedMessage = inner;
      }

      try {
        const message = JSON.parse(returnedMessage);
        console.info(`Completed call. Response: `);
        console.dir(JSON.stringify(message));
      } catch (e) {
        console.info(`Completed call. Response: ${returnedMessage}`);
      }

      return { message: returnedMessage };
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
