"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Jstz } from "@jstz-dev/jstz-client";
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
      smartFunctionAddress: "KT1Vf83uoTN7i2C8m6WBzZ6xhtdY9fC5vkKf",
      accountAddress: "tz1UVvGHshMXugu18DxJxSXfnpAT7nEwj7w5",
    },
    resolver: zodResolver(schema),
  });

  const form = useWatch({ control });
  const [notification, setNotification] = useState("");

  async function sendSigningRequest(operation: unknown) {
    return sendMessage<
      { signature: string; publicKey: string; accountAddress: string } | { error: string }
    >({
      type: WalletEvents.SIGN,
      data: { operation },
    });
  }

  async function callSmartFunction(pathToCall: string) {
    const { accountAddress, smartFunctionAddress } = form as Form;

    setNotification("Calling the smart function...");

    const jstzClient = new Jstz({
      timeout: 6000,
    });

    //const nonce = await jstzClient.accounts.getNonce(accountAddress).catch(console.error);

    //if (!nonce) {
    //  setNotification(
    //    "This account has not been revealed; make an XTZ transaction with the account before calling a smart function.",
    //  );
    //  return;
    //}

    try {
      const operation = {
        content: buildRequest(smartFunctionAddress, pathToCall),
        //nonce,
        source: accountAddress,
      };

      // NOTE: Sign operation using provided secret key
      // DO NOT use this in production until Jstz has a way of signing in a secure manner
      setNotification("Signing operation...");
      const signingResponse = await sendSigningRequest(operation);

      if ("error" in signingResponse) {
        setNotification("Error signing operation: " + signingResponse.error);
        return;
      }

      const { signature, publicKey } = signingResponse;

      setNotification("Operation signed! Public key: " + publicKey);
      const {
        result: {
          inner: { body },
        },
      } = await jstzClient.operations.injectAndPoll({
        inner: operation,
        public_key: publicKey,
        signature: signature,
      });

      const returnedMessage = body
        ? JSON.parse(decoder.decode(new Uint8Array(body)))
        : "No message.";

      setNotification("Completed call. Response: " + returnedMessage);
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

            <div>
              <Label>Jstz account address:</Label>

              <Input {...register("accountAddress")} />
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
