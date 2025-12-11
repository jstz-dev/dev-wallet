"use client";
import Jstz from "@jstz-dev/jstz-client";
import { createContext, type PropsWithChildren, useContext, useRef } from "react";
import { createJstzClient } from "~/lib/jstz-signer.service";

interface JstzClientContext {
  getJstzClient: () => Jstz;
}

const JstzClientContext = createContext<JstzClientContext>({} as JstzClientContext);

type JstzClientContextProps = PropsWithChildren;

export function JstzClientContextProvider({ children }: JstzClientContextProps) {
  const jstzClient = useRef<Jstz | null>(null);

  function getJstzClient() {
    if (jstzClient.current === null) {
      jstzClient.current = createJstzClient();
    }

    return jstzClient.current;
  }

  return (
    <JstzClientContext
      value={{
        getJstzClient,
      }}
    >
      {children}
    </JstzClientContext>
  );
}

export function useJstzClient() {
  return useContext(JstzClientContext);
}
