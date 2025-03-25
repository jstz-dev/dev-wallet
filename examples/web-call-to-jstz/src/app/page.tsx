"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Jstz from "@jstz-dev/jstz-client";
import { Label } from "@radix-ui/react-label";

import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import z from "zod";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { buildRequest } from "~/lib/buildRequest";
import { callSmartFunction, SignResponse } from "~/lib/jstz-extension-communication";

const decoder = new TextDecoder("utf-8");

const schema = z.object({
  smartFunctionAddress: z.string(),
  accountAddress: z.string(),
  publicKey: z.string(),
  secretKey: z.string(),
});

type Form = z.infer<typeof schema>;

export default function Home() {
  const { register, control, setError } = useForm({
    defaultValues: {
      smartFunctionAddress: "",
    },
    resolver: zodResolver(schema),
  });

  const form = useWatch({ control });
  const [notification, setNotification] = useState("");

  async function callCounterSmartFunction(path: string) {
    const { smartFunctionAddress = "" } = form;

    if (!smartFunctionAddress) {
      setNotification("Smart function address is required");
      return;
    }

    try {
      setNotification("Waiting for your request to be signed by the extension...");
      await callSmartFunction({
        smartFunctionRequest: buildRequest({ smartFunctionAddress, path }),
        onSignatureReceived,
      });
    } catch (err) {
      setNotification("Error calling smart function: " + err);
    }
  }

  async function onSignatureReceived(response: SignResponse) {
    const { operation, signature, publicKey, accountAddress } = response.data;

    setNotification(`Operation signed with address: ${accountAddress}`);

    const jstzClient = new Jstz.Jstz({
      timeout: 6000,
    });

    try {
      const {
        result: { inner },
      } = await jstzClient.operations.injectAndPoll({
        inner: operation,
        public_key: publicKey,
        signature,
      });

      let returnedMessage = "No message";

      if (typeof inner === "object" && "body" in inner) {
        returnedMessage = inner.body && JSON.parse(decoder.decode(new Uint8Array(inner.body)));
      }

      if (typeof inner === "string") {
        returnedMessage = inner;
      }

      setNotification(`Completed call. Response: ${returnedMessage}`);
    } catch (err) {
      setNotification(JSON.stringify(err));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="mx-auto w-100">
        <CardHeader>
          <CardTitle>Call the counter smart function</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            <div>
              <Label>
                <a
                  href="https://github.com/jstz-dev/jstz/blob/main/examples/counter/README.md"
                  target="_blank"
                >
                  Counter
                </a>{" "}
                smart function address:
              </Label>

              <Input {...register("smartFunctionAddress")} />
            </div>
          </div>

          <div className="mt-4 flex justify-between">
            <Button
              onClick={() => {
                void callCounterSmartFunction("/get");
              }}
            >
              Get
            </Button>

            <Button
              onClick={() => {
                void callCounterSmartFunction("/increment");
              }}
            >
              Increment
            </Button>

            <Button
              onClick={() => {
                void callCounterSmartFunction("/decrement");
              }}
            >
              Decrement
            </Button>
          </div>

          <p>{notification}</p>
        </CardContent>

        <CardFooter>
          <Alert variant="warning">
            <TriangleAlert className="size-4" />

            <AlertTitle>WARNING</AlertTitle>

            <AlertDescription>
              This application does not encrypt private keys and therefore should not be used in
              production. This application is a demonstration of how Jstz works and not a secure
              application.
            </AlertDescription>
          </Alert>
        </CardFooter>
      </Card>
    </div>
  );
}
