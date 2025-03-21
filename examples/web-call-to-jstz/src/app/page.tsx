"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Jstz from "@jstz-dev/jstz-client";
import { Label } from "@radix-ui/react-label";

import { TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
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

  //TODO: abstract listeners to a lib or sdk
  useEffect(() => {
    if (!!window) {
      window.addEventListener("SIGN_RESPONSE", ((
        event: CustomEvent<
          | {
              type: WalletEvents.SIGN_RESPONSE;
              data: {
                operation: Jstz.Operation;
                signature: string;
                publicKey: string;
                accountAddress: string;
              };
            }
          | {
              type: WalletEvents.SIGN_RESPONSE;
              error: string;
            }
        >,
      ) => {
        onSignatureReceived(event);
      }) as EventListener);
    }
    return () =>
      window.removeEventListener("SIGN_RESPONSE", ((
        event: CustomEvent<
          | {
              type: WalletEvents.SIGN_RESPONSE;
              data: {
                operation: Jstz.Operation;
                signature: string;
                publicKey: string;
                accountAddress: string;
              };
            }
          | {
              type: WalletEvents.SIGN_RESPONSE;
              error: string;
            }
        >,
      ) => {
        onSignatureReceived(event);
      }) as EventListener);
  }, []);

  function callSmartFunction(pathToCall: string) {
    const { smartFunctionAddress } = form as Form;

    requestSignature(buildRequest({ smartFunctionAddress, path: pathToCall }));
  }

  function requestSignature(requestToSign: Jstz.Operation.RunFunction) {
    setNotification("Sending a request to sign...");

    const signEvent = new CustomEvent<{ type: WalletEvents; content: Jstz.Operation.RunFunction }>(
      WalletEvents.SIGN,
      {
        detail: { type: WalletEvents.SIGN, content: requestToSign },
      },
    );
    window.dispatchEvent(signEvent);
    // window.postMessage({ type: WalletEvents.SIGN, data: { content: requestToSign } }, "*");
  }

  async function onSignatureReceived(
    response: CustomEvent<
      | {
          type: WalletEvents.SIGN_RESPONSE;
          data: {
            operation: Jstz.Operation;
            signature: string;
            publicKey: string;
            accountAddress: string;
          };
        }
      | {
          type: WalletEvents.SIGN_RESPONSE;
          error: string;
        }
    >,
  ) {
    console.log(response);
    if ("error" in response.detail) {
      setNotification("Error signing operation: " + response.detail.error);
      return;
    }

    const { operation, signature, publicKey, accountAddress } = response.detail.data;

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
