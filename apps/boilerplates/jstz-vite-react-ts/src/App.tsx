import { useEffect, useRef, useState } from "react";
import { useJstzSigner } from "~/hooks/useJstzSigner";
import { textDecode, textEncode } from "~/lib/encoder.ts";
import { JstzSignerClient } from "~/lib/jstz-signer/jstz-signer.client.ts";
import { type IncreaseForm } from "../dapp";
import "./App.css";
import jstzLogo from "./assets/jstz.svg";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

/**
 * @property dAppAddress - address of the smart function deployed from ../dapp
 * @example
 * // KT1KQERjRDyuHsLvCaUAz4nxdg3n9jpbcW8N
 */
const dAppAddress = import.meta.env.VITE_DAPP_ADDRESS;

function App() {
  const jstzClientRef = useRef(JstzSignerClient.createJstzClient());

  const { signOperation, checkExtensionAvailability } = useJstzSigner();

  const [processing, setProcessing] = useState(false);
  const [response, setResponse] = useState("");
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    void fetchCounter();
  }, []);

  /**
   * @func fetchCounter - uses Jstz client to obtain the current state of the smart function's KV store (https://jstz.tezos.com/functions/data_storage)
   */
  async function fetchCounter() {
    try {
      const jstzClient = jstzClientRef.current;
      const resp = (await jstzClient.accounts.getKv(dAppAddress, { key: "root" })) as string;

      const kv = JSON.parse(resp);

      setCounter(kv?.counter ?? 0);
    } catch (e) {
      console.warn(e);
    }
  }

  async function signAndInject(payload: IncreaseForm) {
    try {
      setProcessing(true);

      const jstzClient = jstzClientRef.current;

      /**
       * https://jstz.tezos.com/quick_start#5-interacting-with-the-smart-function-in-a-web-application
       */
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

      await fetchCounter();

      return { message: returnedMessage };
    } catch (err) {
      setResponse(`Error: ${toErrorMessage(err)}`);
      throw err;
    } finally {
      setProcessing(false);
    }
  }

  function toErrorMessage(value: unknown): string {
    if (typeof value === "string") return value;
    if (value instanceof Error) return value.message;

    if (
      typeof value === "object" &&
      value !== null &&
      "message" in value &&
      typeof (value as { message: unknown }).message === "string"
    )
      return value.message as string;

    return "Unknown error";
  }

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
      <div className="card">
        <p> Count is {counter}</p>
        <button disabled={processing} onClick={() => signAndInject({ value: 1 })}>
          +1
        </button>
        <p>{response}</p>
      </div>
      <p className="read-the-docs">Click on the Jstz, Vite or React logos to learn more</p>
    </>
  );
}

export default App;
