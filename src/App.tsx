import { useEffect, useReducer, type ComponentPropsWithRef } from "react";

import { cn } from "./lib/utils";

type Action =
  | {
      type: "increment" | "decrement";
    }
  | {
      type: "set";
      payload: number;
    };

function reducer(state: number, action: Action) {
  switch (action.type) {
    case "increment":
      chrome.storage.local.set({ counter: state + 1 });
      return state + 1;

    case "decrement":
      chrome.storage.local.set({ counter: state - 1 });
      return state - 1;

    case "set":
      chrome.storage.local.set({ counter: action.payload });
      return action.payload;
  }
}

export default function App() {
  const [counter, dispatch] = useReducer(reducer, 0);

  useEffect(() => {
    (async () => {
      const value = await chrome.storage.local.get("counter");

      if (value.counter) dispatch({ type: "set", payload: value.counter });
    })();
  }, []);

  return (
    <div className="flex min-w-48 flex-col gap-2 p-4">
      <h1 className="text-4xl font-bold">Hello World!</h1>
      <p className="text-xl font-bold">Counter: {counter}</p>

      <div className="flex gap-4">
        <Button onClick={() => dispatch({ type: "increment" })}>Increment</Button>

        <Button onClick={() => dispatch({ type: "decrement" })}>Decrement</Button>
      </div>
    </div>
  );
}

function Button(props: ComponentPropsWithRef<"button">) {
  return (
    <button
      {...props}
      className={cn(
        "max-w-min rounded-sm border border-black bg-slate-600 px-2 py-1 text-slate-100 hover:bg-slate-500",
        props.className,
      )}
    />
  );
}
