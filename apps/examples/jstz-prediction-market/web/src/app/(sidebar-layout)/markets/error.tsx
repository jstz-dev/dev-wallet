"use client";

import { ServerCrash } from "lucide-react";
import { useEffect, useEffectEvent } from "react";

interface MarketsErrorPage {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MarketsErrorPage({ error }: MarketsErrorPage) {
  const onRender = useEffectEvent(() => {
    console.error(error);
  });

  useEffect(() => {
    onRender();
  }, []);

  return (
    <main className="flex-1">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Markets</h1>

          <p className="mt-2 text-muted-foreground">
            Show you&apos;re an expert. Trade on the outcomes of future events.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <ServerCrash className="size-12 text-muted-foreground" />
          </div>

          <h3 className="text-xl font-semibold mb-2">We couldn&apos;t fetch available markets</h3>

          <p className="text-muted-foreground max-w-md">
            At this time we couldn&apos;t fetch the list of markets. This is an error on our side.
            We&apos;re probably working on resolving the issue right at this moment.
          </p>
        </div>
      </div>
    </main>
  );
}
