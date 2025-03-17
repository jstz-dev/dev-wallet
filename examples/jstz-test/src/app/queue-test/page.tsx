"use client";

import { Loader2 } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import * as WalletEventEmitter from "~/lib/WalletEventEmitter";

export default function QueueTest() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const processes = useRef<number[]>([]);
  const [responses, setResponses] = useState<string[]>([]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("send request");

    setIsLoading(true);
    processes.current.push(0);
    WalletEventEmitter.sendMessageSync(
      {
        type: WalletEventEmitter.WalletEvents.QUEUE,
        data: { message: inputRef.current?.value },
      },
      (res: { message: string }) => {
        console.log(res);
        processes.current.shift();

        if (processes.current.length === 0) {
          setIsLoading(false);
        }

        setResponses((prev) => [...prev, res.message]);
      },
    );
  }

  async function processRequests() {
    console.log("process");

    const response = await WalletEventEmitter.sendMessage({
      type: WalletEventEmitter.WalletEvents.PROCESS_QUEUE,
    });

    console.log(response);
  }

  return (
    <div className="w-60">
      <h1>Queue test</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input ref={inputRef} required />

        <div className="flex gap-4">
          <Button type="submit">Send</Button>
        </div>
      </form>

      <Button type="button" onClick={processRequests}>
        Process
      </Button>

      {isLoading ?
        <Loader2 className="animate-spin" />
      : <ul>
          {responses.map((res, i) => (
            <li key={`${res}${i}`}>{res}</li>
          ))}
        </ul>
      }
    </div>
  );
}
