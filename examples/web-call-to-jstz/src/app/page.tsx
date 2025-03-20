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
import { sendMessage, WalletEvents } from "~/lib/WalletEventEmitter";
import { buildRequest } from "~/lib/buildRequest";

const decoder = new TextDecoder("utf-8");

const schema = z.object({
  smartFunctionAddress: z.string(),
  accountAddress: z.string(),
  publicKey: z.string(),
  secretKey: z.string(),
});

type Form = z.infer<typeof schema>;

export default function Home() {
  const { register, control } = useForm({
    defaultValues: {
      smartFunctionAddress: "KT1RtPzCe7MnGEcc1YhAS5RYK4VKFNXFvcKe",
    },
    resolver: zodResolver(schema),
  });

  const form = useWatch({ control });
  const [notification, setNotification] = useState("");

  async function sendSigningRequest(runFunctionRequest: Jstz.Operation.RunFunction) {
    return sendMessage<
      | {
          operation: Jstz.Operation;
          signature: string;
          publicKey: string;
          accountAddress: string;
        }
      | { error: string }
    >({
      type: WalletEvents.SIGN,
      data: { content: runFunctionRequest },
    });
  }

  async function callSmartFunction(pathToCall: string) {
    const { smartFunctionAddress } = form as Form;

    const requestToSign = buildRequest({ smartFunctionAddress, path: pathToCall });

    try {
      setNotification("Sending a request to sign...");
      const signingResponse = await sendSigningRequest(requestToSign);

      if ("error" in signingResponse) {
        setNotification("Error signing operation: " + signingResponse.error);
        return;
      }

      const { operation, signature, publicKey, accountAddress } = signingResponse;

      setNotification(`Operation signed with address: ${accountAddress}`);

      const jstzClient = new Jstz.Jstz({
        timeout: 6000,
      });

      const {
        result: { inner },
      } = await jstzClient.operations.injectAndPoll({
        inner: operation,
        public_key: publicKey,
        signature,
      });

      let returnedMessage = "No message.";

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
                callSmartFunction("/get");
              }}
            >
              Get
            </Button>

            <Button
              onClick={() => {
                callSmartFunction("/increment");
              }}
            >
              Increment
            </Button>

            <Button
              onClick={() => {
                callSmartFunction("/decrement");
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
