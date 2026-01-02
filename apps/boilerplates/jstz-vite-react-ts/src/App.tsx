import { useRef, useState } from "react";
import { useJstzSigner } from "~/hooks/useJstzSigner";
import { textDecode, textEncode } from "~/lib/encoder.ts";
import { JstzSignerClient } from "~/lib/jstz-signer/jstz-signer.client.ts";
import "./App.css";
import jstzLogo from "./assets/jstz.svg";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

function App() {
  const jstzClientRef = useRef(JstzSignerClient.createJstzClient());

  const { signOperation, checkExtensionAvailability } = useJstzSigner();

  const [processing, setProcessing] = useState(false);
  const [response, setResponse] = useState("");

  async function signAndInject() {
    try {
      setProcessing(true);

      const jstzClient = jstzClientRef.current;

      const isExtensionAvailable = await checkExtensionAvailability();

      if (!isExtensionAvailable) {
        setResponse("Jstz Signer extension is not available");
        return;
      }

      // Fill up the env variable with the address of the function deployed from ../dapp
      // KT1...
      const address = import.meta.env.VITE_DAPP_ADDRESS;

      const { operation, signature, verifier } = await signOperation({
        content: {
          _type: "RunFunction",
          uri: `jstz://${address}/bet`,
          headers: {},
          method: "POST",
          body: textEncode({ value: 2 }),
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
        returnedMessage =
          (inner.body && JSON.stringify(textDecode(inner.body), null, 2)) ?? "No message.";
      }

      if (typeof inner === "string") {
        returnedMessage = inner;
      }

      console.info(`Completed call. Response: ${returnedMessage}`);

      setResponse(returnedMessage);

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
        <button disabled={processing} onClick={signAndInject}>
          Sign and inject
        </button>
        <p>{response}</p>
      </div>
      <p className="read-the-docs">Click on the Jstz, Vite or React logos to learn more</p>
    </>
  );
}

export default App;
