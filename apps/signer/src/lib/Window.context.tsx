import { createContext, useContext, useEffect, useRef, type PropsWithChildren } from "react";
import { ResponseEventTypes } from "~/scripts/service-worker.ts";

interface WindowContext {
  close: () => void;
}

const WindowContext = createContext<WindowContext>({} as WindowContext);

export function WindowContextProvider({ children }: PropsWithChildren) {
  const isProgrammaticallyClosing = useRef(false);

  function onClose() {
    if (!isProgrammaticallyClosing.current) {
      void chrome.runtime.sendMessage({ type: ResponseEventTypes.DECLINE });
    }

    window.close();
    return false;
  }

  useEffect(() => {
    window.addEventListener("beforeunload", onClose, { once: true });

    return () => {
      window.removeEventListener("beforeunload", onClose);
    };
  }, []);

  function close() {
    isProgrammaticallyClosing.current = true;
    window.close();
  }

  return <WindowContext value={{ close }}>{children}</WindowContext>;
}

export function useWindowContext() {
  return useContext(WindowContext);
}
