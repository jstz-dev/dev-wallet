import {createContext, useContext, useState, type PropsWithChildren, useEffect} from "react";
import {ResponseEventTypes} from "~/scripts/service-worker.ts";

interface WindowContext {
    isProgrammaticallyClosing: boolean
    close: () => void
}

const WindowContext = createContext<WindowContext>({} as WindowContext);

export function WindowContextProvider({ children }: PropsWithChildren) {
    const [isProgrammaticallyClosing, setIsProgrammaticallyClosing] = useState(false)

    useEffect(() => {
        window.addEventListener("unload", onClose, { once: true });
    }, []);

    function onClose() {
        if (!isProgrammaticallyClosing) {
            void chrome.runtime.sendMessage({ type: ResponseEventTypes.DECLINE });
        }
        window.close();
        return false;
    }

    function close() {
        setIsProgrammaticallyClosing(true);
        window.close();
    }

    return (
        <WindowContext value={{ isProgrammaticallyClosing, close }}>{children}</WindowContext>
    );
}

export function useWindowContext() {
    return useContext(WindowContext);
}
