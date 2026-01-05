import { Suspense, use, useState } from "react";
import { useJstzSigner } from "~/hooks/useJstzSigner";
import { textDecode, textEncode } from "~/lib/encoder.ts";
import { JstzSignerClient } from "~/lib/jstz-signer/jstz-signer.client.ts";
import { type IncreaseForm } from "../dapp";
import "./App.css";
import jstzLogo from "./assets/jstz.svg";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

/**
 * @example
 *   KT1KQERjRDyuHsLvCaUAz4nxdg3n9jpbcW8N;
 *
 * @property dAppAddress - Address of the smart function deployed from ../dapp
 */
const dAppAddress = import.meta.env.VITE_DAPP_ADDRESS;

export default function App() {
  return (
    <>
      <div>
        <a href="https://jstz.tezos.com/" target="_blank">
          <img src={jstzLogo} className="logo" alt="Jstz logo" />
        </a>

        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>

        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <h1>Jstz + Vite + React</h1>

      <Suspense fallback={<CounterCardFallback />}>
        <CounterCard />
      </Suspense>

      <p className="read-the-docs">Click on the Jstz, Vite or React logos to learn more</p>
    </>
  );
}

const jstzClient = JstzSignerClient.createJstzClient();

/**
 * Uses Jstz client to obtain the current state of the smart function's KV store
 *
 * @see {@link https://jstz.tezos.com/functions/data_storage Data Storage}
 */
async function fetchCounter() {
  const resp = (await jstzClient.accounts.getKv(dAppAddress, { key: "root" })) as string;

  const kv = JSON.parse(resp);
  return (kv?.counter as number) ?? 0;
}

const initialCounterPromise = fetchCounter();

function CounterCard() {
  const { signOperation, checkExtensionAvailability } = useJstzSigner();

  const [processing, setProcessing] = useState(false);
  const [response, setResponse] = useState("");

  const initialCounter = use(initialCounterPromise);

  const [counter, setCounter] = useState(initialCounter);

  async function signAndInject(payload: IncreaseForm) {
    try {
      setProcessing(true);

      /** @see {@link https://jstz.tezos.com/quick_start#5-interacting-with-the-smart-function-in-a-web-application} */
      const isExtensionAvailable = await checkExtensionAvailability();

      if (!isExtensionAvailable) {
        setResponse("Jstz Signer extension is not available");
        return;
      }

      const { operation, signature, verifier } = await signOperation({
        content: {
          _type: "RunFunction",
          uri: `jstz://${dAppAddress}/counter/increase`,
          headers: {},
          method: "POST",
          body: textEncode(payload),
          gasLimit: 55_000,
        },
      });

      const {
        result: { inner },
      } = await jstzClient.operations.injectAndPoll({
        inner: operation,
        signature,
        verifier: verifier ?? null,
      });

      let returnedMessage = "No message.";

      if (typeof inner === "object" && "body" in inner) {
        const parsedBody = inner.body && textDecode(inner.body);
        if (!parsedBody) {
          returnedMessage = "Success but no return message from the dapp";
        } else if (parsedBody.message) {
          returnedMessage = parsedBody.message;
        } else {
          returnedMessage = JSON.stringify(parsedBody, null, 2);
        }
      }

      if (typeof inner === "string") {
        returnedMessage = inner;
      }

      console.info(`Completed call. Response: ${returnedMessage}`);

      setResponse(returnedMessage);

      const newCounter = await fetchCounter();
      setCounter(newCounter);

      return { message: returnedMessage };
    } catch (err) {
      setResponse(`Error: ${toErrorMessage(err)}`);
      throw err;
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="card">
      <p> Count is {counter}</p>

      <button disabled={processing} onClick={() => signAndInject({ value: 1 })}>
        +1
      </button>

      <p>{response}</p>
    </div>
  );
}

function CounterCardFallback() {
  return (
    <div className="card">
      <p> Count is Loading...</p>

      <button disabled>+1</button>

      <p />
    </div>
  );
}

function toErrorMessage(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;

  if (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message;
  }

  return "Unknown error";
}
