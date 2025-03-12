import { useReducer, type ComponentPropsWithRef } from "react";

import { cn } from "./lib/utils";

function reducer(state: number, action: "increment" | "decrement") {
  switch (action) {
    case "increment":
      return state + 1;
    case "decrement":
      return state - 1;
  }
}

export default function App() {
  const [counter, dispatch] = useReducer(reducer, 0);

  return (
    <div className="flex min-w-48 flex-col gap-2 p-4">
      <h1 className="text-4xl font-bold">Hello World!</h1>
      <p className="text-xl font-bold">Counter: {counter}</p>

      <div className="flex gap-4">
        <Button onClick={() => dispatch("increment")}>Increment</Button>
        <Button onClick={() => dispatch("decrement")}>Decrement</Button>
      </div>

      <Button onClick={onClickHandler}>Hello!</Button>
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

async function onClickHandler() {
  const [tab] = await chrome.tabs.query({ active: true });
  if (!tab?.id) {
    console.info("No tab found.");
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      alert("Hello from my extension!");
    },
  });
}
