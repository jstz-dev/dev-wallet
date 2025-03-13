import Button from "./components/Button";
import { useStorageLocal } from "./lib/hooks/useStorageLocal";

export default function App() {
  const { data, refetch } = useStorageLocal("counter", 0);

  async function setCounter(value: number) {
    await chrome.storage.local.set({ counter: value });
    refetch();
  }

  return (
    <div className="flex min-w-48 flex-col gap-2 p-4">
      <h1 className="text-4xl font-bold">Hello World!</h1>
      <p className="text-xl font-bold">Counter: {data}</p>

      <div className="flex gap-4">
        <Button
          onClick={() => {
            if (data !== undefined) setCounter(data + 1);
          }}
        >
          Increment
        </Button>

        <Button
          onClick={() => {
            if (data !== undefined) setCounter(data - 1);
          }}
        >
          Decrement
        </Button>
      </div>
    </div>
  );
}
